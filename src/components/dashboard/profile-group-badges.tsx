import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  getProfileGroupBadgeHint,
  getProfileGroupBadgeVariant,
  getProfileGroupDisplayLabel,
} from '#/lib/profile-groups'

export function ProfileGroupSection({
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
        <ul className="mt-1 flex flex-wrap gap-1.5 overflow-visible">
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

export function ProfileGroupBadge({ group }: { group: string }) {
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
