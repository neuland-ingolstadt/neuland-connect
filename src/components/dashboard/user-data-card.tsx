import { Badge } from '#/components/ui/badge'
import { TerminalPanel } from '#/components/ui/terminal-panel'

type UserDataCardProps = {
  name: string
  email: string
  username: string
  groups: string[]
}

export function UserDataCard({
  name,
  email,
  username,
  groups,
}: UserDataCardProps) {
  return (
    <TerminalPanel title="Profil">
      <div className="space-y-4 p-5">
        <dl className="space-y-4">
          <DetailItem label="Name" value={name} />
          <DetailItem label="E-Mail" value={email} />
          <DetailItem label="Benutzername" value={username} />
        </dl>

        {groups.length > 0 ? (
          <div className="border-t border-terminal-window-border pt-4">
            <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
              Gruppen
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {groups.map(group => (
                <li key={group}>
                  <Badge variant="secondary">{group}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

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
