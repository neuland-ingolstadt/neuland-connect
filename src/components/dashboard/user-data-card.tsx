import { useMemo, useState } from 'react'
import { ProfileGroupSection } from '#/components/dashboard/profile-group-badges'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useI18n } from '#/lib/i18n/locale-context'
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
  const { t } = useI18n()
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
    <TerminalPanel
      title={t('profile.card.title')}
      subtitle={t('profile.card.subtitle')}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <dl className="space-y-4">
          <DetailItem label={t('profile.name')} value={name} />
          <DetailItem label={t('profile.email')} value={email} />
          <DetailItem label={t('profile.username')} value={username} />
        </dl>

        {hasProfileGroups ? (
          <div className="space-y-2.5">
            <ProfileGroupSection
              title={t('profile.honor')}
              groups={honorGroups}
            />
            <ProfileGroupSection
              title={t('profile.ressorts')}
              groups={ressortGroups}
            />
            <ProfileGroupSection
              title={t('profile.groups')}
              groups={visibleOtherGroups}
              expandLabel={
                hasMoreOtherGroups
                  ? groupsExpanded
                    ? t('common.showLess')
                    : t('common.showMore', { count: hiddenCount })
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
      <dt className="meta-label">{label}</dt>
      <dd className="mt-0.5 break-all text-sm text-terminal-text">
        {value || '-'}
      </dd>
    </div>
  )
}
