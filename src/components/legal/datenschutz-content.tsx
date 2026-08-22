export function DatenschutzContent() {
  return (
    <div className="space-y-8 p-5 text-sm leading-relaxed text-terminal-text/80 sm:p-6">
      <section>
        <p>
          Verantwortliche Stelle:
          <br />
          Neuland Ingolstadt e.V.
          <br />
          Esplanade 10
          <br />
          85049 Ingolstadt
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Das Wichtigste in Kürze
        </h2>
        <p className="mt-2">
          Diese Datenschutzerklärung gilt für{' '}
          <strong className="font-medium text-terminal-text">
            Neuland Connect
          </strong>{' '}
          - das interne Mitgliederportal unter{' '}
          <span className="font-mono text-terminal-text/90">
            connect.neuland.ing
          </span>
          . Der Dienst ist nur für Vereinsmitglieder zugänglich und dient der
          Verknüpfung von Konten (GitHub, Discord) sowie dem Onboarding in
          Vereinsdienste.
        </p>
        <p className="mt-2">
          Connect setzt{' '}
          <strong className="font-medium text-terminal-text">
            keine Analytics
          </strong>{' '}
          ein und erhebt keine Nutzungsstatistiken. Es werden nur die für
          Betrieb, Anmeldung und Kontoverknüpfung erforderlichen Daten
          verarbeitet.
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Anmeldung und Sitzung
        </h2>
        <p className="mt-2">
          Die Anmeldung erfolgt über{' '}
          <strong className="font-medium text-terminal-text">Authentik</strong>{' '}
          (OpenID Connect). Connect speichert keine eigenen Nutzerkonten -
          Profildaten (Name, E-Mail, Benutzername) stammen aus Authentik und
          werden bei Bedarf von dort gelesen.
        </p>
        <p className="mt-2">
          Nach erfolgreicher Anmeldung wird eine verschlüsselte{' '}
          <strong className="font-medium text-terminal-text">
            Sitzungs-Cookie
          </strong>{' '}
          gesetzt (<span className="font-mono">neuland-connect-session</span>,
          max. 7 Tage). Darin werden u. a. deine Authentik-Benutzerkennung,
          E-Mail und Name sowie OIDC-Token für den Abmeldevorgang gehalten. Das
          Cookie ist HttpOnly und wird nicht an Dritte weitergegeben.
        </p>
        <p className="mt-2">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Durchführung der
          Mitglieder-Anmeldung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
          Interesse am sicheren Betrieb des Portals).
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Kontoverknüpfungen (GitHub, Discord)
        </h2>
        <p className="mt-2">
          Optional kannst du GitHub- und Discord-Konten verknüpfen. Dabei
          leitest du dich kurz bei dem jeweiligen Anbieter an; Connect erhält
          nur die für die Verknüpfung nötigen Angaben (z. B. Benutzername und
          numerische ID).
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
          <li>
            <strong className="font-medium text-terminal-text">GitHub:</strong>{' '}
            OAuth mit Berechtigung <span className="font-mono">read:user</span>.
            Zugriffstoken werden{' '}
            <strong className="font-medium text-terminal-text">
              nicht dauerhaft gespeichert
            </strong>
            .
          </li>
          <li>
            <strong className="font-medium text-terminal-text">Discord:</strong>{' '}
            OAuth mit Berechtigungen <span className="font-mono">identify</span>{' '}
            und <span className="font-mono">guilds.join</span>. Tokens werden
            nach dem Callback verworfen; der Bot dient der Server- und
            Rollenzuweisung.
          </li>
        </ul>
        <p className="mt-2">
          Verknüpfungsstatus und IDs werden als{' '}
          <strong className="font-medium text-terminal-text">
            Attribute in Authentik
          </strong>{' '}
          gespeichert (nicht in einer eigenen Connect-Datenbank). Connect hat
          keinen Zugriff auf Passwörter oder private Inhalte deiner verknüpften
          Konten.
        </p>
        <p className="mt-2">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Bereitstellung der
          gewünschten Integrationsfunktionen für Mitglieder).
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Web-Server-Logs
        </h2>
        <p className="mt-2">
          Beim Abruf von Seiten und API-Endpunkten übermittelt dein Browser
          technische Daten an den Web-Server. Folgende Angaben werden für{' '}
          <strong className="font-medium text-terminal-text">
            vierzehn Tage
          </strong>{' '}
          protokolliert: IP-Adresse, Zeitstempel, HTTP-Methode, aufgerufene URL.
        </p>
        <p className="mt-2">
          Zweck ist der sichere Betrieb, Fehleranalyse und Missbrauchserkennung.
          Eine Weitergabe an Dritte oder Übermittlung in Drittstaaten findet
          nicht statt.
        </p>
        <p className="mt-2">
          Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am
          Betrieb und der Sicherheit des Dienstes). Du kannst Widerspruch durch
          formlose Nachricht an die verantwortliche Stelle einlegen; gib dabei
          nach Möglichkeit deine IP-Adresse an.
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Drittanbieter
        </h2>
        <p className="mt-2">
          Für Anmeldung und Integrationen werden folgende Dienste genutzt. Es
          gelten zusätzlich deren Datenschutzbestimmungen:
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
          <li>
            <strong className="font-medium text-terminal-text">
              Authentik
            </strong>{' '}
            - Identitäts- und Zugriffsverwaltung (Vereins-intern gehostet)
          </li>
          <li>
            <a
              href="https://docs.github.com/de/site-policy/privacy-policies/github-privacy-statement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
            >
              GitHub
            </a>{' '}
            - optionale Kontoverknüpfung und Organisations-Einladungen
          </li>
          <li>
            <a
              href="https://discord.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
            >
              Discord
            </a>{' '}
            - optionale Kontoverknüpfung und Serverbeitritt
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Rechte der betroffenen Personen
        </h2>
        <p className="mt-2">
          Werden personenbezogene Daten von dir verarbeitet, bist du Betroffene
          oder Betroffener. Dir stehen gegenüber dem Verantwortlichen u. a. zu:
          Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Widerspruch und Datenübertragbarkeit, soweit die
          Voraussetzungen der DSGVO erfüllt sind.
        </p>
        <p className="mt-2">
          Profiländerungen in Authentik erfolgen über den Vorstand, nicht direkt
          in Connect.
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Beschwerderecht
        </h2>
        <p className="mt-2">
          Du hast das Recht, dich bei einer Aufsichtsbehörde zu beschweren, wenn
          du der Ansicht bist, dass die Verarbeitung deiner personenbezogenen
          Daten nicht rechtmäßig erfolgt. Zuständige Behörde:{' '}
          <a
            href="https://lda.bayern.de"
            target="_blank"
            rel="noopener noreferrer"
            className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
          >
            Bayerisches Landesamt für Datenschutzaufsicht
          </a>{' '}
          (lda.bayern.de, Telefon 0981 53 1300).
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Stand
        </h2>
        <p className="mt-2">
          Erste Version: 22.08.2026
          <br />
          Letzte Aktualisierung: 22.08.2026
        </p>
      </section>
    </div>
  )
}
