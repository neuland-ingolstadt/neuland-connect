import { TerminalPanel } from '#/components/ui/terminal-panel'

type UserDataCardProps = {
  name: string
  email: string
  username: string
}

export function UserDataCard({ name, email, username }: UserDataCardProps) {
  return (
    <TerminalPanel title="Profil">
      <div className="space-y-4 p-5">
        <dl className="space-y-4">
          <DetailItem label="Name" value={name} />
          <DetailItem label="E-Mail" value={email} />
          <DetailItem label="Benutzername" value={username} />
        </dl>

        <p className="border-t border-terminal-window-border pt-4 text-xs leading-relaxed text-terminal-text/50">
          Änderungen beim Vorstand melden.
        </p>
      </div>
    </TerminalPanel>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
        {label}
      </dt>
      <dd className="mt-0.5 break-all font-mono text-sm text-terminal-text">
        {value || '-'}
      </dd>
    </div>
  )
}
