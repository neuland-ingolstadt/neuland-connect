# Discord-Guild-Sync und Linked Roles

Mitglieder verknüpfen Discord, treten dem Server bei, danach weist der Bot Rollen zu. Optional schreibt Connect **Linked Roles**-Metadaten (kein YouTube/Riot-Partner nötig — jede Discord-App).

## Für Mitglieder

1. **Discord verbinden** auf dem Dashboard – Connect speichert deine Discord-User-ID und lädt dich direkt in den Server ein (`guilds.join`).
2. **Rollen** – sobald du im Server bist, ordnet der Bot deine Vereinsgruppen den Discord-Rollen zu (automatisch per Cron oder „Rollen synchronisieren“).
3. **Linked Roles** (optional) – im Discord-Servermenü unter **Linked Roles** Connect als Nachweis hinterlegen. Die Metadaten kommen aus Authentik (Mitglied, Vorstand, Ehrenmitglied, Ressorts).

Falls du den Server verlassen hast oder der automatische Beitritt fehlschlägt: **Discord erneut verbinden** – der OAuth-Flow versucht den Serverbeitritt erneut. Neu verbinden aktualisiert auch die Linked-Role-Metadaten (Tokens werden nicht gespeichert).

Beim Trennen der Verknüpfung bleibst du im Discord-Server, verlierst aber alle **Bot-Rollen**. Die Discord-Linked-Role bleibt, bis du sie in Discord selbst trennst (ohne User-Token kann Connect sie nicht löschen).

## Zwei getrennte Credentials

| Credential | Zweck | Berechtigung |
|------------|-------|--------------|
| **OAuth App** | Mitglied verknüpft sein Discord-Konto + Linked Roles | `identify`, `guilds.join`, `role_connections.write` |
| **Bot** | Serverbeitritt per User-Token + Rollen setzen | Create Instant Invite (für PUT member), Manage Roles |

OAuth-Tokens werden **nicht** gespeichert.

## Ablauf

### Nach Verknüpfung (OAuth)

1. Callback speichert `discord_username`, `discord_id`, `discord_connected_at` in Authentik
2. Wenn Bot konfiguriert: Hintergrund-Check, ob die User-ID bereits im Guild ist
3. Wenn nein: `PUT /guilds/{guild}/members/{id}` mit dem noch gültigen User-Access-Token (`guilds.join`)
4. Wenn im Server: `discord_guild_status = member`, Rollen synchronisieren
5. Wenn Beitritt fehlschlägt: `discord_guild_last_error` optional; Mitglied kann über „Erneut verbinden“ erneut versuchen
6. Parallel: Linked-Role-Metadaten per User-Token schreiben; Token danach verwerfen

### Trennen

1. Bot entfernt alle Rollen des Members (`PATCH` mit leerer Rollenliste, Fallback: einzelne `DELETE`)
2. Mitgliedschaft im Server bleibt bestehen (kein Kick)
3. Authentik-Attribute (`discord_*`) werden gelöscht
4. Discord-Linked-Role wird nicht automatisch entfernt (kein User-Token)

### Cron

Der Cron ist Nachzieher für verknüpfte User mit `discord_id`:

| Situation | Aktion |
|-----------|--------|
| Noch nicht im Server | Überspringen; `discord_guild_status` / `joined_at` zurücksetzen, falls veraltet |
| Im Server, Rollen fehlen/überzählig (nur gemappte Rollen) | PUT/DELETE Rollen; `joined_at` nur setzen, wenn noch leer |
| Bereits korrekt | Status beibehalten, `joined_at` nicht überschreiben |

**Endpoint:** `POST /api/internal/discord-roles/sync`  
**Auth:** `Authorization: Bearer $CRON_SECRET`

```bash
curl -X POST https://connect.neuland.ing/api/internal/discord-roles/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

Empfohlenes Intervall: alle 15–60 Minuten.

## Linked Roles (Application Role Connections)

Eigene Apps stehen **nicht** neben YouTube/League in User Settings → Connections. Sie erscheinen erst unter **Server Settings → Roles → Links → Add requirement**, wenn Verification-URL und Metadata-Schema gesetzt sind. Kein Partner-Status nötig.

### Einmalig im Discord Developer Portal

1. Derselbe Bot wie für Role-Sync ist auf dem Neuland-Server.
2. **General Information** → **Linked Roles Verification URL**:

```
{APP_URL}/api/integrations/discord/linked-role
```

Produktion: `https://connect.neuland.ing/api/integrations/discord/linked-role`

3. **OAuth2 → Redirects** bleibt `{APP_URL}/api/integrations/discord/callback`.
4. Metadata-Schema mit Bot-Token registrieren (passiert auch automatisch beim ersten Connect):

```bash
curl -X POST https://connect.neuland.ing/api/internal/discord-linked-roles/register \
  -H "Authorization: Bearer $CRON_SECRET"
```

Danach taucht die App unter **Links → Add requirement** auf.

### Metadaten (max. 5)

| Key | Bedeutung |
|-----|-----------|
| `is_member` | Authentik-User mit dieser Discord-ID verknüpft |
| `is_vorstand` | Authentik-Gruppe `Vorstand` |
| `is_ehrenmitglied` | Gruppe matcht Ehrenmitglied |
| `is_organisation` | Ressort `organisation` |
| `is_engineering` | Ressort `engineering` |

Beispiel: Rolle „Neuland-Mitglied“ mit Requirement `is_member = wahr`.

### Mitgliedsfluss

1. Discord in Connect verknüpfen (`discord_id` in Authentik).
2. Servername → **Linked Roles** → Rolle → Connect.
3. Discord öffnet die Verification-URL. Connect startet OAuth (`identify` + `role_connections.write`), schreibt Metadaten, verwirft den Token.
4. Discord vergibt die Rolle, wenn die Requirements passen.

Ohne Connect-Verknüpfung schreibt Connect `is_member = 0`. Der Cron kann Linked Roles **nicht** nachziehen (kein gespeichertes User-Token). Nach Gruppenänderungen: **Neu verbinden** oder Linked Roles in Discord erneut auslösen.

## Authentik-Attribute

| Attribut | Werte / Zweck |
|----------|---------------|
| `discord_username` | Discord-Login |
| `discord_id` | Snowflake User-ID |
| `discord_connected_at` | ISO-Zeitstempel der Verknüpfung |
| `discord_guild_status` | `member` wenn im Server erkannt |
| `discord_guild_joined_at` | ISO-Zeitstempel, wann Mitgliedschaft erkannt wurde |
| `discord_guild_last_error` | Fehlermeldung bei Sync-Problemen |

### Gruppen-Mapping

Authentik-Gruppenattribut `discord_role` = Discord-Rollen-Snowflake als **Text (String)**.

**Wichtig:** Nicht als Integer/Zahl speichern. Discord-IDs sind größer als JavaScript sicher verarbeiten kann - als Zahl werden sie verfälscht und Discord antwortet mit `Unknown Role (10011)`.

1. Authentik → Gruppe → Attribute → Typ **String**
2. Wert aus Discord kopieren (Entwicklermodus → Rolle → ID kopieren), z. B. `1539348988757803100`
3. Nach Änderung des Typs den Wert **neu eintragen** (alte Integer-Werte können bereits korrupt sein)

## Umgebungsvariablen

```env
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
DISCORD_BOT_TOKEN=
DISCORD_GUILD_ID=
```

## Code

| Bereich | Pfad |
|---------|------|
| OAuth | `src/lib/integrations/discord/oauth.ts` |
| Bot API | `src/lib/integrations/discord/guild.ts` |
| Rollen-Sync | `src/lib/integrations/discord/roles-sync.ts` |
| Cron | `src/routes/api/internal/discord-roles/sync.ts` |
| Linked Roles | `src/lib/integrations/discord/linked-roles.ts` |
| Verification URL | `GET /api/integrations/discord/linked-role` |
| Metadata register | `POST /api/internal/discord-linked-roles/register` |
| Dashboard | `src/components/dashboard/discord-connection-card.tsx` |
