import { useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import {
  getProfileGroupBadgeHint,
  getProfileGroupBadgeVariant,
  getProfileGroupDisplayLabel,
  partitionProfileGroups,
} from '#/lib/profile-groups'
import { formatDate } from '#/lib/utils'

const VISIBLE_GROUP_LIMIT = 4

type UserDataCardProps = {
  name: string
  email: string
  username: string
  groups: string[]
  integrationGroupsShownSeparately: boolean
  accountCreatedAt: string | null
}

export function UserDataCard({
  name,
  email,
  username,
  groups,
  integrationGroupsShownSeparately,
  accountCreatedAt,
}: UserDataCardProps) {
  const [groupsExpanded, setGroupsExpanded] = useState(false)
  const { honorGroups, ressortGroups, otherGroups, ordered: sortedGroups } =
    useMemo(() => partitionProfileGroups(groups), [groups])
  const frontGroups = useMemo(
    () => [...honorGroups, ...ressortGroups],
    [honorGroups, ressortGroups],
  )
  const remainingVisibleSlots = Math.max(
    0,
    VISIBLE_GROUP_LIMIT - frontGroups.length,
  )
  const hasMoreOtherGroups = otherGroups.length > remainingVisibleSlots
  const visibleOtherGroups =
    groupsExpanded || !hasMoreOtherGroups
      ? otherGroups
      : otherGroups.slice(0, remainingVisibleSlots)
  const visibleGroups = [...frontGroups, ...visibleOtherGroups]
  const hiddenCount = sortedGroups.length - visibleGroups.length

  return (
    <TerminalPanel title="Profil" className="overflow-visible">
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

        {sortedGroups.length > 0 ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
              {integrationGroupsShownSeparately ? 'Vereinsgruppen' : 'Gruppen'}
              <span className="ml-1 text-terminal-text/25">
                ({sortedGroups.length})
              </span>
            </p>
            {integrationGroupsShownSeparately ? (
              <p className="mt-1 text-[11px] leading-snug text-terminal-text/45">
                Gruppen mit GitHub- oder Discord-Sync findest du in den
                Integrationskarten.
              </p>
            ) : null}
            <ul className="mt-2 flex flex-wrap gap-1.5 overflow-visible">
              {visibleGroups.map(group => (
                <li key={group} className="min-w-0 max-w-full">
                  <ProfileGroupBadge group={group} />
                </li>
              ))}
            </ul>
            {hiddenCount > 0 ? (
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

function ProfileGroupBadge({ group }: { group: string }) {
  const variant = getProfileGroupBadgeVariant(group)
  const hint = getProfileGroupBadgeHint(group)
  const label = getProfileGroupDisplayLabel(group)

  if (!hint) {
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <span
      className="neuland-badge-hint inline-flex max-w-full"
      tabIndex={0}
      title={hint}
    >
      <Badge variant={variant} className="cursor-help">
        {label}
      </Badge>
      <span className="neuland-badge-hint__tooltip" role="tooltip">
        {hint}
      </span>
    </span>
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
