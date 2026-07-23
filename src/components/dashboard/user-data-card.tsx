import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { formatDate } from '#/lib/utils'

const VISIBLE_GROUP_LIMIT = 4

type UserDataCardProps = {
  name: string
  email: string
  username: string
  groups: string[]
  accountCreatedAt: string | null
}

export function UserDataCard({
  name,
  email,
  username,
  groups,
  accountCreatedAt,
}: UserDataCardProps) {
  const [groupsExpanded, setGroupsExpanded] = useState(false)
  const hasMoreGroups = groups.length > VISIBLE_GROUP_LIMIT
  const visibleGroups =
    groupsExpanded || !hasMoreGroups
      ? groups
      : groups.slice(0, VISIBLE_GROUP_LIMIT)
  const hiddenCount = groups.length - visibleGroups.length

  return (
    <TerminalPanel title="Profil">
      <div className="space-y-4 p-5">
        <dl className="space-y-4">
          <DetailItem label="Name" value={name} />
          <DetailItem label="E-Mail" value={email} />
          <DetailItem label="Benutzername" value={username} />
          {accountCreatedAt ? (
            <DetailItem
              label="Konto erstellt"
              value={formatDate(accountCreatedAt)}
            />
          ) : null}
        </dl>

        {groups.length > 0 ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
              Gruppen
              <span className="ml-1 text-terminal-text/25">
                ({groups.length})
              </span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {visibleGroups.map(group => (
                <li key={group} className="min-w-0 max-w-full">
                  <Badge variant="secondary" className="max-w-full truncate">
                    {group}
                  </Badge>
                </li>
              ))}
            </ul>
            {hasMoreGroups ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-auto px-0 py-0 font-mono text-[11px] text-terminal-text/50 hover:bg-transparent hover:text-terminal-cyan"
                onClick={() => setGroupsExpanded(expanded => !expanded)}
              >
                {groupsExpanded
                  ? 'Weniger anzeigen'
                  : `+${hiddenCount} weitere`}
              </Button>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-terminal-text/50">
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
