import { useMemo } from 'react'
import { ProfileGroupSection } from '#/components/dashboard/profile-group-badges'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { useI18n } from '#/lib/i18n/locale-context'
import { partitionProfileGroups } from '#/lib/profile-groups'

type DashboardProfilePanelProps = {
  name: string
  username: string
  groups: string[]
}

export function DashboardProfilePanel({
  name,
  username,
  groups,
}: DashboardProfilePanelProps) {
  const { honorGroups, ressortGroups } = useMemo(
    () => partitionProfileGroups(groups),
    [groups],
  )
  const { t } = useI18n()

  return (
    <TerminalPanel title={t('dashboard.profile.title')}>
      <div className="space-y-3 p-4 sm:p-5">
        <div>
          <p className="meta-label">{t('dashboard.profile.name')}</p>
          <p className="mt-0.5 break-words text-sm text-terminal-text">
            {name || '—'}
          </p>
        </div>
        <div>
          <p className="meta-label">{t('dashboard.profile.username')}</p>
          <p className="mt-0.5 break-all text-sm text-terminal-text">
            {username || '—'}
          </p>
        </div>
        <ProfileGroupSection
          title={t('dashboard.profile.honor')}
          groups={honorGroups}
        />
        <ProfileGroupSection
          title={t('dashboard.profile.ressorts')}
          groups={ressortGroups}
        />
      </div>
    </TerminalPanel>
  )
}
