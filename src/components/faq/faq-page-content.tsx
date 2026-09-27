import { useI18n } from '#/lib/i18n/locale-context'
import type { Locale, MessageKey } from '#/lib/i18n/messages'

type FaqItemId =
  | 'was'
  | 'events'
  | 'ablauf'
  | 'daten'
  | 'trennen'
  | 'rollen'
  | 'sync'
  | 'github-einladung'
  | 'next'
  | 'abmelden'

const FAQ_QUESTION_KEYS: Record<FaqItemId, MessageKey> = {
  was: 'faq.q.was',
  events: 'faq.q.events',
  ablauf: 'faq.q.ablauf',
  daten: 'faq.q.daten',
  trennen: 'faq.q.trennen',
  rollen: 'faq.q.rollen',
  sync: 'faq.q.sync',
  'github-einladung': 'faq.q.githubEinladung',
  next: 'faq.q.next',
  abmelden: 'faq.q.abmelden',
}

const FAQ_ORDER: FaqItemId[] = [
  'was',
  'events',
  'ablauf',
  'daten',
  'trennen',
  'rollen',
  'sync',
  'github-einladung',
  'next',
  'abmelden',
]

function FaqAnswer({ id, locale }: { id: FaqItemId; locale: Locale }) {
  if (locale === 'en') {
    return <EnglishAnswer id={id} />
  }
  return <GermanAnswer id={id} />
}

function GermanAnswer({ id }: { id: FaqItemId }) {
  switch (id) {
    case 'was':
      return (
        <>
          <p>
            Connect ist das Mitgliederportal von Neuland Ingolstadt. Nach der
            Anmeldung mit deinem Neuland-Konto (Authentik) siehst du auf dem
            Dashboard Vereinstermine, dein Profil und den Status deiner
            Verknüpfungen. Unter Ressourcen findest du Freigaben zu internen
            Diensten, abhängig von deinen Gruppen.
          </p>
          <p>
            GitHub und Discord verknüpfst du auf der Konten-Seite. Darüber
            erhältst du Zugang zur Organisation, zu Teams, zum Discord-Server
            und zu den zugehörigen Rollen. Die Anmeldung ist auf
            Vereinsmitglieder beschränkt. Änderungen an Name, E-Mail-Adresse
            oder Benutzername nimmt der Vorstand vor, nicht diese Anwendung.
          </p>
        </>
      )
    case 'events':
      return (
        <p>
          Auf dem Dashboard listet Connect die Termine von Neuland Ingolstadt
          aus dem Campus-Life-Kalender. Du kannst zwischen bevorstehenden und
          vergangenen Terminen (bis zwei Monate zurück) wechseln. Ein Klick
          öffnet die Details. Die Kontoverknüpfung bleibt auf der Konten-Seite.
        </p>
      )
    case 'ablauf':
      return (
        <>
          <p>Der Ablauf auf der Konten-Seite ist wie folgt:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>GitHub:</strong> Konto verbinden, Einladung in die
              Organisation annehmen. Die Team-Mitgliedschaften ergeben sich aus
              deinen Authentik-Gruppen.
            </li>
            <li>
              <strong>Discord:</strong> Konto verbinden. Du wirst dem Server
              hinzugefügt; die Rollen folgen ebenfalls aus deinen
              Authentik-Gruppen.
            </li>
            <li>
              <strong>Mitgliedsausweis:</strong> Neuland Next installieren und
              dort mit dem Neuland-Konto anmelden. Connect speichert dafür keine
              zusätzlichen Zugangsdaten.
            </li>
          </ol>
          <p>
            GitHub und Discord erhalten nur die erforderlichen Berechtigungen
            (GitHub: <code className="font-mono text-[12px]">read:user</code>,
            Discord: Identität und Serverbeitritt). Die Zugriffstoken werden
            nach der Verknüpfung verworfen und nicht gespeichert.
          </p>
        </>
      )
    case 'daten':
      return (
        <>
          <p>
            Connect führt keine eigene Nutzerdatenbank. Dein Profil (Name,
            E-Mail, Benutzername, Gruppen) liegt in Authentik und wird im Portal
            angezeigt. Die Vereinstermine kommen aus dem Campus-Life-Kalender
            und werden nicht dauerhaft in Connect gespeichert. In Authentik wird
            zusätzlich festgehalten, welche Konten verknüpft sind:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              GitHub: Benutzername, numerische ID, Zeitpunkt der Verknüpfung,
              Status in der Organisation (eingeladen / Mitglied)
            </li>
            <li>
              Discord: Benutzername, ID, Zeitpunkt der Verknüpfung sowie die
              Information, ob du dem Server angehörst
            </li>
          </ul>
          <p>
            Für die Sitzung setzt Connect ein verschlüsseltes Cookie.
            OpenID-Connect-Token werden nur vorgehalten, damit die Abmeldung bei
            Authentik möglich ist. Passwörter von GitHub, Discord oder Authentik
            sind Connect nicht zugänglich.
          </p>
        </>
      )
    case 'trennen':
      return (
        <>
          <p>
            Über das Menü der jeweiligen Karte kannst du die Verknüpfung lösen.
            Betroffen ist nur die Kopplung in Connect und Authentik. Deine
            Konten bei GitHub bzw. Discord bleiben bestehen.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>GitHub:</strong> Die Verknüpfung in Authentik wird
              entfernt. Von Connect verwaltete Teams in der Organisation werden
              zurückgenommen. Die Mitgliedschaft in der GitHub-Organisation
              bleibt erhalten.
            </li>
            <li>
              <strong>Discord:</strong> Die Verknüpfung in Authentik wird
              entfernt. Von Connect verwaltete Server-Rollen werden
              zurückgenommen. Die Mitgliedschaft auf dem Server bleibt erhalten.
            </li>
          </ul>
          <p>
            Anschließend kannst du dasselbe oder ein anderes Konto erneut
            verbinden.
          </p>
        </>
      )
    case 'rollen':
      return (
        <>
          <p>
            Rollen und Teams richten sich nach deinen Authentik-Gruppen, nicht
            nach manuellen Zuweisungen in Discord oder GitHub. Connect gleicht
            die von ihm verwalteten Rollen und Teams regelmäßig ab.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              Auf der Konten-Seite bei Discord bzw. GitHub „Synchronisieren“
              ausführen.
            </li>
            <li>
              Prüfen, ob Discord verbunden ist und du dem Server angehörst.
              Andernfalls Discord erneut verbinden.
            </li>
            <li>
              Bei GitHub die Einladung in die Organisation annehmen. Teams
              stehen erst zur Verfügung, wenn du Mitglied der Organisation bist.
            </li>
          </ol>
          <p>
            Fehlt die Rolle oder das Team danach weiterhin, liegt die Ursache in
            der Regel an der Gruppenzugehörigkeit in Authentik. Wende dich in
            diesem Fall an den Vorstand. Discord-Rollen ohne Gruppenzuordnung in
            Authentik bleiben beim Abgleich unberührt. Rollen, die Connect über
            Gruppen verwaltet, werden an den Gruppenstand angeglichen – auch
            wenn sie manuell gesetzt wurden.
          </p>
        </>
      )
    case 'sync':
      return (
        <>
          <p>
            Discord-Rollen und GitHub-Teams werden etwa alle 15 Minuten
            automatisch mit deinen Authentik-Gruppen abgeglichen. Nach einer
            Gruppenänderung kann es daher einige Minuten dauern, bis der Stand
            sichtbar ist.
          </p>
          <p>
            Für eine unmittelbare Aktualisierung steht auf der Konten-Seite bei
            Discord und GitHub der Button „Synchronisieren“ zur Verfügung.
            Entfällt eine Gruppe, wird die zugehörige Rolle bzw. das Team beim
            nächsten Abgleich entfernt – entweder über den Button oder
            spätestens nach 15 Minuten.
          </p>
        </>
      )
    case 'github-einladung':
      return (
        <p>
          Nach der Verknüpfung wird die Einladung automatisch im Hintergrund
          ausgelöst. Prüfe in GitHub die Benachrichtigungen und offenen
          Einladungen. Zeigt Connect den Status „Eingeladen“, muss die Einladung
          in GitHub angenommen werden. Bleibt der Status leer, lade die Seite
          erneut oder warte kurz. Besteht das Problem weiterhin, wende dich an
          den Vorstand.
        </p>
      )
    case 'next':
      return (
        <p>
          Der digitale Mitgliedsausweis ist Teil der App Neuland Next.
          Installiere die App, öffne die Einstellungen und melde dich mit
          demselben Neuland-Konto an. Sobald Authentik eine aktive Next-Sitzung
          erkennt, gilt der Ausweis in Connect als eingerichtet. Das Trennen von
          GitHub oder Discord hat darauf keinen Einfluss.
        </p>
      )
    case 'abmelden':
      return (
        <p>
          Die Abmeldung beendet deine Connect-Sitzung (Cookie) und leitet dich
          zur Authentik-Abmeldeseite weiter. Verknüpfte GitHub- und
          Discord-Konten bleiben bestehen, bis du die Verbindung auf der
          Konten-Seite löst.
        </p>
      )
  }
}

function EnglishAnswer({ id }: { id: FaqItemId }) {
  switch (id) {
    case 'was':
      return (
        <>
          <p>
            Connect is the member portal of Neuland Ingolstadt. After signing in
            with your Neuland account (Authentik), the dashboard shows club
            events, your profile, and the status of your linked accounts. Under
            Resources you find access to internal services, depending on your
            groups.
          </p>
          <p>
            You link GitHub and Discord on the Accounts page. That gives you
            access to the organization, teams, the Discord server, and the
            matching roles. Sign-in is limited to club members. Changes to your
            name, email address, or username are made by the board — not by this
            app.
          </p>
        </>
      )
    case 'events':
      return (
        <p>
          On the dashboard, Connect lists Neuland Ingolstadt events from the
          Campus Life calendar. You can switch between upcoming and past events
          (up to two months back). Clicking opens the details. Account linking
          stays on the Accounts page.
        </p>
      )
    case 'ablauf':
      return (
        <>
          <p>The flow on the Accounts page works like this:</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>
              <strong>GitHub:</strong> connect your account, accept the
              invitation to the organization. Team memberships follow from your
              Authentik groups.
            </li>
            <li>
              <strong>Discord:</strong> connect your account. You are added to
              the server; roles likewise follow from your Authentik groups.
            </li>
            <li>
              <strong>Membership card:</strong> install Neuland Next and sign in
              there with your Neuland account. Connect stores no extra
              credentials for that.
            </li>
          </ol>
          <p>
            GitHub and Discord only get the permissions they need (GitHub:{' '}
            <code className="font-mono text-[12px]">read:user</code>, Discord:
            identity and server join). Access tokens are discarded after linking
            and never stored.
          </p>
        </>
      )
    case 'daten':
      return (
        <>
          <p>
            Connect keeps no user database of its own. Your profile (name,
            email, username, groups) lives in Authentik and is shown in the
            portal. Club events come from the Campus Life calendar and are not
            stored permanently in Connect. Authentik additionally records which
            accounts are linked:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              GitHub: username, numeric ID, time of linking, status in the
              organization (invited / member)
            </li>
            <li>
              Discord: username, ID, time of linking, plus whether you are on
              the server
            </li>
          </ul>
          <p>
            For the session, Connect sets an encrypted cookie. OpenID Connect
            tokens are only kept so sign-out at Authentik stays possible. Your
            GitHub, Discord, or Authentik passwords are never visible to
            Connect.
          </p>
        </>
      )
    case 'trennen':
      return (
        <>
          <p>
            You can unlink from the menu on each card. Only the link in Connect
            and Authentik is affected. Your GitHub and Discord accounts stay as
            they are.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>GitHub:</strong> the link in Authentik is removed.
              Connect-managed teams in the organization are taken back.
              Membership in the GitHub organization is kept.
            </li>
            <li>
              <strong>Discord:</strong> the link in Authentik is removed.
              Connect-managed server roles are taken back. Membership on the
              server is kept.
            </li>
          </ul>
          <p>You can then connect the same or a different account again.</p>
        </>
      )
    case 'rollen':
      return (
        <>
          <p>
            Roles and teams follow your Authentik groups — not manual
            assignments in Discord or GitHub. Connect regularly reconciles the
            roles and teams it manages.
          </p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>On the Accounts page, run “Sync now” for Discord or GitHub.</li>
            <li>
              Check that Discord is connected and you are on the server.
              Otherwise reconnect Discord.
            </li>
            <li>
              On GitHub, accept the invitation to the organization. Teams only
              become available once you are a member of the organization.
            </li>
          </ol>
          <p>
            If the role or team is still missing afterwards, the cause is
            usually your group membership in Authentik. In that case contact the
            board. Discord roles without a group mapping in Authentik are left
            untouched by the sync. Roles that Connect manages through groups are
            aligned with the group state — even if they were set manually.
          </p>
        </>
      )
    case 'sync':
      return (
        <>
          <p>
            Discord roles and GitHub teams are automatically reconciled with
            your Authentik groups about every 15 minutes. After a group change
            it can therefore take a few minutes until the state shows up.
          </p>
          <p>
            For an immediate refresh, the Accounts page offers a “Sync now”
            button for Discord and GitHub. If a group goes away, the matching
            role or team is removed at the next sync — either via the button or
            after 15 minutes at the latest.
          </p>
        </>
      )
    case 'github-einladung':
      return (
        <p>
          After linking, the invitation is triggered automatically in the
          background. Check your GitHub notifications and open invitations. If
          Connect shows the “Invited” status, accept the invitation in GitHub.
          If the status stays empty, reload the page or wait a moment. If the
          problem persists, contact the board.
        </p>
      )
    case 'next':
      return (
        <p>
          The digital membership card is part of the Neuland Next app. Install
          the app, open settings, and sign in with the same Neuland account. As
          soon as Authentik sees an active Next session, the card counts as set
          up in Connect. Disconnecting GitHub or Discord has no effect on it.
        </p>
      )
    case 'abmelden':
      return (
        <p>
          Signing out ends your Connect session (cookie) and takes you to the
          Authentik sign-out page. Linked GitHub and Discord accounts stay until
          you unlink them on the Accounts page.
        </p>
      )
  }
}

export function FaqPageContent() {
  const { t, locale } = useI18n()
  return (
    <div className="divide-y divide-terminal-window-border/60">
      {FAQ_ORDER.map(id => (
        <details key={id} className="group">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-sm text-terminal-text marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 text-terminal-green/70 transition-transform group-open:rotate-90"
              >
                ›
              </span>
              <span>{t(FAQ_QUESTION_KEYS[id])}</span>
            </span>
          </summary>
          <div className="space-y-3 px-4 pb-4 pl-10 text-sm leading-relaxed text-terminal-text/70">
            <FaqAnswer id={id} locale={locale} />
          </div>
        </details>
      ))}
    </div>
  )
}
