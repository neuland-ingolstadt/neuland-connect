import { ExternalLink } from 'lucide-react'
import type { ResourceHubGroup } from '#/lib/resources/hub'
import { getResourceHubIcon } from '#/lib/resources/icons'
import { cn } from '#/lib/utils'

type ResourceHubContentProps = {
  groups: ResourceHubGroup[]
}

export function ResourceHubContent({ groups }: ResourceHubContentProps) {
  if (groups.length === 0) {
    return (
      <div className="p-6">
        <p className="font-mono text-sm text-terminal-text/60">
          Für dein Konto sind derzeit keine Dienste freigeschaltet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {groups.map(group => (
        <section key={group.id} aria-labelledby={`resource-group-${group.id}`}>
          <h2
            id={`resource-group-${group.id}`}
            className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-text/45"
          >
            {group.label}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {group.items.map(item => (
              <li key={item.slug}>
                <ResourceHubCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ResourceHubCard({
  item,
}: {
  item: ResourceHubGroup['items'][number]
}) {
  const Icon = getResourceHubIcon(item.slug)

  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group/card flex h-full items-center gap-3 border border-terminal-window-border bg-terminal-card p-4 no-underline transition-[border-color,background-color,color]',
        'hover:border-terminal-cyan/50 hover:bg-terminal-window',
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-bg transition-colors',
          'group-hover/card:border-terminal-cyan/40 group-hover/card:bg-terminal-card',
        )}
      >
        <Icon
          className="size-4 text-terminal-text/70 transition-colors group-hover/card:text-terminal-cyan/80"
          aria-hidden
        />
      </div>

      <p
        className={cn(
          'min-w-0 flex-1 font-mono text-sm font-semibold text-terminal-text transition-colors',
          'group-hover/card:text-terminal-cyan',
        )}
      >
        {item.name}
      </p>

      <ExternalLink
        className="size-3.5 shrink-0 text-terminal-text/35 transition-colors group-hover/card:text-terminal-cyan/80"
        aria-hidden
      />
    </a>
  )
}
