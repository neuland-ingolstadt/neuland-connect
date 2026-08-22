import { ExternalLink } from 'lucide-react'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import { RESOURCE_CATALOG } from '#/lib/resources/catalog'
import { userCanAccessResource } from '#/lib/resources/hub'
import { getResourceHubIcon } from '#/lib/resources/icons'
import { cn } from '#/lib/utils'

const QUICK_LINK_SLUGS = ['outline', 'cloud'] as const

type DashboardQuickLinksProps = {
  groups: string[]
}

export function DashboardQuickLinks({ groups }: DashboardQuickLinksProps) {
  const items = QUICK_LINK_SLUGS.flatMap(slug => {
    const entry = RESOURCE_CATALOG.find(resource => resource.slug === slug)
    if (!entry || !userCanAccessResource(groups, entry)) {
      return []
    }

    return [
      {
        slug: entry.slug,
        name: entry.name,
        href: entry.href,
      },
    ]
  })

  if (items.length === 0) {
    return null
  }

  return (
    <TerminalPanel title="Schnellzugriff">
      <ul className="divide-y divide-terminal-window-border/50 border-t border-terminal-window-border/50">
        {items.map(item => {
          const Icon = getResourceHubIcon(item.slug)

          return (
            <li key={item.slug}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'group/link flex items-center gap-3 px-4 py-3 no-underline transition-colors sm:px-5',
                  'hover:bg-terminal-window',
                )}
              >
                <span className="flex size-8 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-bg transition-colors group-hover/link:border-terminal-cyan/40">
                  <Icon
                    className="size-3.5 text-terminal-text/70 transition-colors group-hover/link:text-terminal-cyan/80"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0 flex-1 font-mono text-sm text-terminal-text transition-colors group-hover/link:text-terminal-cyan">
                  {item.name}
                </span>
                <ExternalLink
                  className="size-3.5 shrink-0 text-terminal-text/35 transition-colors group-hover/link:text-terminal-cyan/80"
                  aria-hidden
                />
              </a>
            </li>
          )
        })}
      </ul>
    </TerminalPanel>
  )
}
