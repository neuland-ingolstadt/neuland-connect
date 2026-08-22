import { useMemo, useState } from 'react'
import { ProfileGroupSection } from '#/components/dashboard/profile-group-badges'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { partitionProfileGroups } from '#/lib/profile-groups'

const VISIBLE_GROUP_LIMIT = 4

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
        </dl>

        {hasProfileGroups ? (
          <div className="space-y-2.5">
            <ProfileGroupSection title="Exklusiv" groups={honorGroups} />
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
