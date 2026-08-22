import type { ReactNode } from 'react'

type FaqItem = {
  id: string
  question: string
  answer: ReactNode
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'was',
    question: 'Was ist Neuland Connect?',
    answer: (
      <>
        <p>
          Connect ist das Mitgliederportal von Neuland Ingolstadt. Nach der
          Anmeldung mit deinem Neuland-Konto (Authentik) siehst du auf dem
          Dashboard Vereinstermine, dein Profil und den Status deiner
          Verknüpfungen. Unter Ressourcen findest du Freigaben zu internen
          Diensten, abhängig von deinen Gruppen.
        </p>
        <p>
          GitHub und Discord verknüpfst du auf der Connect-Seite. Darüber
          erhältst du Zugang zur Organisation, zu Teams, zum Discord-Server und
          zu den zugehörigen Rollen. Die Anmeldung ist auf Vereinsmitglieder
          beschränkt. Änderungen an Name, E-Mail-Adresse oder Benutzername nimmt
          der Vorstand vor, nicht diese Anwendung.
        </p>
      </>
    ),
  },
  {
    id: 'events',
    question: 'Wo sehe ich die Vereinstermine?',
    answer: (
      <p>
        Auf dem Dashboard listet Connect die Termine von Neuland Ingolstadt aus
        dem Campus-Life-Kalender. Du kannst zwischen bevorstehenden und
        vergangenen Terminen (bis zwei Monate zurück) wechseln. Ein Klick öffnet
        die Details. Die Kontoverknüpfung bleibt auf der Connect-Seite.
      </p>
    ),
  },
  {
    id: 'ablauf',
    question: 'Wie funktioniert die Verknüpfung?',
    answer: (
      <>
        <p>Der Ablauf auf der Connect-Seite ist wie folgt:</p>
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
          Discord: Identität und Serverbeitritt). Die Zugriffstoken werden nach
          der Verknüpfung verworfen und nicht gespeichert.
        </p>
      </>
    ),
  },
  {
    id: 'daten',
    question: 'Welche Daten werden gespeichert?',
    answer: (
      <>
        <p>
          Connect führt keine eigene Nutzerdatenbank. Dein Profil (Name, E-Mail,
          Benutzername, Gruppen) liegt in Authentik und wird im Portal
          angezeigt. Die Vereinstermine kommen aus dem Campus-Life-Kalender und
          werden nicht dauerhaft in Connect gespeichert. In Authentik wird
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
    ),
  },
  {
    id: 'trennen',
    question: 'Was geschieht beim Trennen der Verbindung?',
    answer: (
      <>
        <p>
          Über das Menü der jeweiligen Karte kannst du die Verknüpfung lösen.
          Betroffen ist nur die Kopplung in Connect und Authentik. Deine Konten
          bei GitHub bzw. Discord bleiben bestehen.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>GitHub:</strong> Die Verknüpfung in Authentik wird entfernt.
            Von Connect verwaltete Teams in der Organisation werden
            zurückgenommen. Die Mitgliedschaft in der GitHub-Organisation bleibt
            erhalten.
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
    ),
  },
  {
    id: 'rollen',
    question:
      'Eine Discord-Rolle oder ein GitHub-Team fehlt. Wie gehe ich vor?',
    answer: (
      <>
        <p>
          Rollen und Teams richten sich nach deinen Authentik-Gruppen, nicht
          nach manuellen Zuweisungen in Discord oder GitHub. Connect gleicht die
          von ihm verwalteten Rollen und Teams regelmäßig ab.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Auf der Connect-Seite bei Discord bzw. GitHub „Synchronisieren“
            ausführen.
          </li>
          <li>
            Prüfen, ob Discord verbunden ist und du dem Server angehörst.
            Andernfalls Discord erneut verbinden.
          </li>
          <li>
            Bei GitHub die Einladung in die Organisation annehmen. Teams stehen
            erst zur Verfügung, wenn du Mitglied der Organisation bist.
          </li>
        </ol>
        <p>
          Fehlt die Rolle oder das Team danach weiterhin, liegt die Ursache in
          der Regel an der Gruppenzugehörigkeit in Authentik. Wende dich in
          diesem Fall an den Vorstand. Discord-Rollen ohne Gruppenzuordnung in
          Authentik bleiben beim Abgleich unberührt. Rollen, die Connect über
          Gruppen verwaltet, werden an den Gruppenstand angeglichen – auch wenn
          sie manuell gesetzt wurden.
        </p>
      </>
    ),
  },
  {
    id: 'sync',
    question: 'Rollen oder Teams sind nicht aktuell. Was ist zu tun?',
    answer: (
      <>
        <p>
          Discord-Rollen und GitHub-Teams werden etwa alle 15 Minuten
          automatisch mit deinen Authentik-Gruppen abgeglichen. Nach einer
          Gruppenänderung kann es daher einige Minuten dauern, bis der Stand
          sichtbar ist.
        </p>
        <p>
          Für eine unmittelbare Aktualisierung steht auf der Connect-Seite bei
          Discord und GitHub der Button „Synchronisieren“ zur Verfügung.
          Entfällt eine Gruppe, wird die zugehörige Rolle bzw. das Team beim
          nächsten Abgleich entfernt – entweder über den Button oder spätestens
          nach 15 Minuten.
        </p>
      </>
    ),
  },
  {
    id: 'github-einladung',
    question: 'Die GitHub-Einladung bleibt aus. Was kann ich tun?',
    answer: (
      <p>
        Nach der Verknüpfung wird die Einladung automatisch im Hintergrund
        ausgelöst. Prüfe in GitHub die Benachrichtigungen und offenen
        Einladungen. Zeigt Connect den Status „Eingeladen“, muss die Einladung
        in GitHub angenommen werden. Bleibt der Status leer, lade die Seite
        erneut oder warte kurz. Besteht das Problem weiterhin, wende dich an den
        Vorstand.
      </p>
    ),
  },
  {
    id: 'next',
    question: 'Wie funktioniert der Mitgliedsausweis?',
    answer: (
      <p>
        Der digitale Mitgliedsausweis ist Teil der App Neuland Next. Installiere
        die App, öffne die Einstellungen und melde dich mit demselben
        Neuland-Konto an. Sobald Authentik eine aktive Next-Sitzung erkennt,
        gilt der Ausweis in Connect als eingerichtet. Das Trennen von GitHub
        oder Discord hat darauf keinen Einfluss.
      </p>
    ),
  },
  {
    id: 'abmelden',
    question: 'Was geschieht beim Abmelden?',
    answer: (
      <p>
        Die Abmeldung beendet ausschließlich deine Connect-Sitzung (Cookie) und
        die Anmeldung bei Authentik. Verknüpfte GitHub- und Discord-Konten
        bleiben bestehen, bis du die Verbindung auf der Connect-Seite löst.
      </p>
    ),
  },
]

export function FaqPageContent() {
  return (
    <div className="divide-y divide-terminal-window-border/60">
      {FAQ_ITEMS.map(item => (
        <details key={item.id} className="group">
          <summary className="cursor-pointer list-none px-4 py-3 font-mono text-sm text-terminal-text marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 text-terminal-cyan/70 transition-transform group-open:rotate-90"
              >
                ›
              </span>
              <span>{item.question}</span>
            </span>
          </summary>
          <div className="space-y-3 px-4 pb-4 pl-10 text-sm leading-relaxed text-terminal-text/70">
            {item.answer}
          </div>
        </details>
      ))}
    </div>
  )
}
