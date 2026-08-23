import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { CONNECT_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { getConnectSetupProgress } from '#/lib/integrations/connect-setup'
import { cn } from '#/lib/utils'
import type { CurrentUser } from '#/server/get-current-user'

type ConnectSetupBannerProps = {
  user: CurrentUser
}

export function ConnectSetupBanner({ user }: ConnectSetupBannerProps) {
  const {
    doneCount,
    totalCount,
    githubComplete,
    discordComplete,
    nextComplete,
  } = getConnectSetupProgress(user)

  if (discordComplete && nextComplete) {
    return null
  }

  const steps = [
    { id: 'github', complete: githubComplete },
    { id: 'discord', complete: discordComplete },
    { id: 'next', complete: nextComplete },
  ]

  return (
    <Link
      to={ROUTES.CONNECT}
      search={CONNECT_SEARCH_DEFAULTS}
      className="group mb-5 block overflow-hidden border border-terminal-window-border bg-terminal-window no-underline transition-colors hover:border-terminal-cyan/40 lg:hidden"
    >
      <div className="flex h-0.5">
        {steps.map(step => (
          <div
            key={step.id}
            className={cn(
              'h-full flex-1 transition-colors',
              step.complete ? 'bg-terminal-cyan' : 'bg-terminal-cyan/15',
            )}
          />
        ))}
      </div>

      <span className="flex items-center gap-3 px-3 py-2.5">
        <span className="min-w-0 flex-1">
          <span className="block font-mono text-xs font-semibold tracking-wide text-terminal-text">
            Connect einrichten
          </span>
          <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-terminal-text/50 transition-colors group-hover:text-terminal-cyan">
            {doneCount}/{totalCount} eingerichtet →
          </span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-terminal-text/45 transition-colors group-hover:text-terminal-cyan"
          aria-hidden
        />
      </span>
    </Link>
  )
}
