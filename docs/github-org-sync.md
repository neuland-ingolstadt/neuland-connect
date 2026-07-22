# GitHub Org-Sync

Automatische Einladung verknüpfter Mitglieder in die Neuland-GitHub-Organisation.

## Zwei getrennte GitHub-Credentials

| Credential | Zweck | Berechtigung |
|------------|-------|--------------|
| **OAuth App** | Mitglied verknüpft sein GitHub-Konto | `read:user` |
| **GitHub App** | Connect lädt in die Org ein | Organization Members: Read & write |

Die OAuth App reicht nicht für Org-Einladungen - dafür ist die GitHub App nötig.

## Ablauf

### Sofort nach Verknüpfung (OAuth)

Wenn ein Mitglied GitHub verbindet, passiert **sofort** Folgendes - **ohne** Cron:

1. OAuth-Callback speichert `github_username`, `github_id`, `github_connected_at` in Authentik
2. Direkt danach: `enqueueOrgInvite()` im Hintergrund (fire-and-forget, blockiert den Redirect nicht)
3. Connect prüft **vor** jeder Einladung die Mitgliedschaft bei GitHub:
   - `GET /orgs/{org}/memberships/{username}` → `state: active` → `github_org_status = member`, **keine Einladung**
   - `state: pending` oder offene Einladung → `github_org_status = invited`, **keine Einladung**
   - Sonst → Einladung senden → `github_org_status = invited`

Der User landet direkt auf dem Dashboard; die Einladung läuft parallel im Hintergrund.

Voraussetzung: GitHub App ist konfiguriert (`GITHUB_APP_*` + `GITHUB_ORG`).

### Was macht der Cron-Job?

Der Cron ist **kein Ersatz** für die Sofort-Einladung, sondern ein **Nachzieher**:

| Situation | Cron-Aktion |
|-----------|-------------|
| Einladung beim ersten Mal fehlgeschlagen | Erneut versuchen |
| User hat Einladung angenommen, Status noch `invited` | Auf `member` setzen |
| Alte User vor dem Feature, nie eingeladen | Einladung nachholen |
| Status bereits `member` | Überspringen |

Der Cron verarbeitet alle Authentik-User mit verknüpftem GitHub, deren `github_org_status` **nicht** `member` ist.

**Endpoint:** `POST /api/internal/github-org/sync`  
**Auth:** `Authorization: Bearer $CRON_SECRET`

```bash
curl -X POST https://connect.neuland.ing/api/internal/github-org/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

Empfohlenes Intervall: alle 15–60 Minuten (Kubernetes CronJob o. ä.).

## Werden User aus der Org entfernt?

**Nein.** Connect entfernt niemanden automatisch aus der GitHub-Organisation.

Beim **Trennen** der Verknüpfung in Connect passiert nur:

- Authentik-Attribute werden gelöscht (`github_username`, `github_id`, `github_connected_at`, `github_org_status`, `github_org_invited_at`, `github_org_last_error`)
- **Kein** API-Call an GitHub zum Entfernen aus der Organisation

Der User bleibt Org-Mitglied, bis das manuell in GitHub passiert. Auto-Remove bei Disconnect ist bewusst nicht implementiert (siehe `AGENTS.md`).

## Authentik-Attribute

| Attribut | Werte / Zweck |
|----------|---------------|
| `github_username` | GitHub-Login |
| `github_id` | Numerische GitHub-User-ID |
| `github_connected_at` | ISO-Zeitstempel der Verknüpfung |
| `github_org_status` | `invited` oder `member` |
| `github_org_invited_at` | ISO-Zeitstempel, wann die Einladung gesendet wurde |
| `github_org_last_error` | Fehlermeldung bei Sync-Problemen (Support/Debug) |

## Umgebungsvariablen

```env
# GitHub App (Org-Einladungen)
GITHUB_APP_ID=123456
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_INSTALLATION_ID=98765432
GITHUB_ORG=neuland-ingolstadt

# Cron-Endpoint
CRON_SECRET=ein-langer-zufaelliger-string
```

Ohne GitHub-App-Konfiguration: Verknüpfung funktioniert weiter, Org-Einladungen werden übersprungen (Warnung im Server-Log).

### PEM als Env-Var

```bash
awk 'NR>1{printf "\\n"}{printf "%s",$0}' ~/Downloads/your-key.pem
```

Ausgabe in `.env` mit Anführungszeichen setzen. Details: `README.md` → GitHub App.

### Installation ID finden

Die `GITHUB_APP_INSTALLATION_ID` steht **nicht** auf der App-Settings-Seite. Sie existiert erst nach Installation der App auf der Organisation:

1. GitHub App → **Install App** → Zahnrad/Configure bei der Org
2. URL: `.../installations/<ID>` - diese Zahl ist die Installation ID

## Dashboard-Onboarding (4 Schritte)

1. **Mitglied** - immer erledigt (Authentik gated Login)
2. **Verknüpft** - `github_username` + `github_id` vorhanden
3. **Eingeladen** - `github_org_status === 'invited'` (oder `member`)
4. **Org-Zugang** - `github_org_status === 'member'`

## Code-Referenz

| Modul | Pfad |
|-------|------|
| GitHub App API (JWT, Invite, Membership) | `src/lib/integrations/github/org.ts` |
| Sync-Logik + `enqueueOrgInvite()` | `src/lib/integrations/github/sync.ts` |
| Cron-Endpoint | `src/routes/api/internal/github-org/sync.ts` |
| OAuth-Callback (triggert Sofort-Einladung) | `src/lib/integrations/github/oauth.ts` |

## Kurzübersicht

| Frage | Antwort |
|-------|---------|
| Sofort eingeladen? | **Ja**, direkt nach OAuth-Verknüpfung (Hintergrund) |
| Braucht man Cron? | **Empfohlen** - Status nachziehen, Fehler retry, `invited` → `member` |
| User aus Org entfernt? | **Nein** - weder bei Disconnect noch per Cron |
| OAuth-Token gespeichert? | **Nein** - nur für einen API-Call beim Verknüpfen |
| GitHub-App-Token gespeichert? | **Nein** - Installation Token wird pro Request generiert (kurz gecacht) |
