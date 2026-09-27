import { useMemo } from 'react'
import { ProfileGroupSection } from '#/components/dashboard/profile-group-badges'
import { TerminalPanel } from '#/components/ui/terminal-panel'
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

  return (
    <TerminalPanel title="Profil">
      <div className="space-y-3 p-4 sm:p-5">
        <div>
          <p className="meta-label">Name</p>
          <p className="mt-0.5 break-words text-sm text-terminal-text">
            {name || '—'}
          </p>
        </div>
        <div>
          <p className="meta-label">Benutzername</p>
          <p className="mt-0.5 break-all text-sm text-terminal-text">
            {username || '—'}
          </p>
        </div>
        <ProfileGroupSection title="Spezialrollen" groups={honorGroups} />
        <ProfileGroupSection title="Ressorts" groups={ressortGroups} />
      </div>
    </TerminalPanel>
  )
}
