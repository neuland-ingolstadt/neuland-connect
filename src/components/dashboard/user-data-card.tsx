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
  const { honorGroups, ressortGroups, otherGroups } = useMemo(
    () => partitionProfileGroups(groups),
    [groups],
  )
  const hasProfileGroups =
    honorGroups.length > 0 || ressortGroups.length > 0 || otherGroups.length > 0
  const hasMoreOtherGroups = otherGroups.length > VISIBLE_GROUP_LIMIT
  const visibleOtherGroups =
    groupsExpanded || !hasMoreOtherGroups
      ? otherGroups
      : otherGroups.slice(0, VISIBLE_GROUP_LIMIT)
  const hiddenCount = otherGroups.length - visibleOtherGroups.length

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

        {hasProfileGroups ? (
          <div className="space-y-3">
            <ProfileGroupSection title="Besonderes" groups={honorGroups} />
            <ProfileGroupSection title="Ressorts" groups={ressortGroups} />
            <ProfileGroupSection
              title="Gruppen"
              groups={visibleOtherGroups}
              expandLabel={
                hasMoreOtherGroups
                  ? groupsExpanded
                    ? 'Weniger anzeigen'
                    : `+${hiddenCount} weitere`
                  : null
              }
              onToggleExpand={
                hasMoreOtherGroups
                  ? () => setGroupsExpanded(expanded => !expanded)
                  : undefined
              }
            />
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-terminal-text/50">
          Änderungen beim Vorstand melden.
        </p>
      </div>
    </TerminalPanel>
  )
}

function ProfileGroupSection({
  title,
  groups,
  expandLabel,
  onToggleExpand,
}: {
  title: string
  groups: string[]
  expandLabel?: string | null
  onToggleExpand?: () => void
}) {
  if (groups.length === 0 && !expandLabel) {
    return null
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-terminal-text/40">
        {title}
      </p>
      {groups.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5 overflow-visible">
          {groups.map(group => (
            <li key={group} className="min-w-0 max-w-full">
              <ProfileGroupBadge group={group} />
            </li>
          ))}
        </ul>
      ) : null}
      {expandLabel && onToggleExpand ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-auto px-0 py-0 font-mono text-[11px] text-terminal-text/50 hover:bg-transparent hover:text-terminal-cyan"
          onClick={onToggleExpand}
        >
          {expandLabel}
        </Button>
      ) : null}
    </div>
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
    <span className="neuland-badge-hint inline-flex max-w-full" title={hint}>
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
