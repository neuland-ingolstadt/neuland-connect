import { EXTERNAL_LINKS } from '#/lib/constants'

export function ImpressumContent() {
  return (
    <div className="space-y-8 p-5 text-sm leading-relaxed text-terminal-text/80 sm:p-6">
      <section>
        <p>
          Dieses Impressum gilt für{' '}
          <strong className="font-medium text-terminal-text">
            Neuland Connect
          </strong>
          . Betreiber ist der nachfolgend genannte Verein.
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Verein
        </h2>
        <p className="mt-2">
          Neuland Ingolstadt e.V.
          <br />
          Esplanade 10
          <br />
          85049 Ingolstadt
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Registergericht
        </h2>
        <p className="mt-2">
          Amtsgericht Ingolstadt
          <br />
          Registernummer: VR 201088
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Kontakt
        </h2>
        <ul className="mt-2 space-y-1">
          <li>
            <a
              href="mailto:info@neuland-ingolstadt.de"
              className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
            >
              info@neuland-ingolstadt.de
            </a>
          </li>
          <li>
            <a
              href="tel:+4915678384646"
              className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
            >
              +49 156 78384646
            </a>
          </li>
          <li>
            <a
              href={EXTERNAL_LINKS.WEBSITE}
              target="_blank"
              rel="noopener noreferrer"
              className="text-terminal-cyan transition-colors hover:text-terminal-highlight"
            >
              neuland-ingolstadt.de
            </a>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Vorstand
        </h2>
        <p className="mt-2">Vertreten durch:</p>
        <ul className="mt-2 list-inside list-disc space-y-1 pl-1">
          <li>Felix Weber</li>
          <li>Nico Märtin</li>
          <li>Ronja Meitz</li>
        </ul>
        <p className="mt-2">
          Inhaltlich verantwortlich gemäß § 18 Abs. 2 MStV: Felix Weber
        </p>
      </section>

      <section>
        <h2 className="font-mono text-base font-semibold text-terminal-lightGreen">
          Haftung für Inhalte und Links
        </h2>
        <p className="mt-2">
          Connect ist ein internes Mitgliederportal ohne öffentliche
          redaktionelle Inhalte. Für externe Verlinkungen (GitHub, Discord,
          Vereinswebsite) übernehmen wir keine Haftung für fremde Inhalte; für
          illegale Inhalte haften wir erst ab Kenntnis.
        </p>
      </section>
    </div>
  )
}
