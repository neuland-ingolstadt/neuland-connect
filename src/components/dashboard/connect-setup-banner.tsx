import { Link } from '@tanstack/react-router'
import { ArrowRight, TriangleAlert } from 'lucide-react'
import { CONNECT_SEARCH_DEFAULTS, ROUTES } from '#/lib/constants'
import { getConnectSetupProgress } from '#/lib/integrations/connect-setup'
import type { CurrentUser } from '#/server/get-current-user'

type ConnectSetupBannerProps = {
  user: CurrentUser
}

export function ConnectSetupBanner({ user }: ConnectSetupBannerProps) {
  const { doneCount, totalCount, discordComplete, nextComplete } =
    getConnectSetupProgress(user)

  if (discordComplete && nextComplete) {
    return null
  }

  return (
    <Link
      to={ROUTES.CONNECT}
      search={CONNECT_SEARCH_DEFAULTS}
      className="mb-5 flex items-center gap-3 border border-destructive/45 bg-destructive/10 px-3 py-2.5 no-underline transition-colors hover:border-destructive/70 hover:bg-destructive/15 lg:hidden"
    >
      <span className="flex size-8 shrink-0 items-center justify-center border border-destructive/40 bg-destructive/15 text-destructive">
        <TriangleAlert className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-xs font-semibold tracking-wide text-destructive">
          Connect einrichten
        </span>
        <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-destructive/75">
          {doneCount}/{totalCount} eingerichtet
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-destructive" aria-hidden />
    </Link>
  )
}
