import { ArrowUpRight, Newspaper } from 'lucide-react'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import type { BlogPost } from '#/lib/blog/types'
import { EXTERNAL_LINKS } from '#/lib/constants'
import { cn } from '#/lib/utils'

type BlogPostsPanelProps = {
  posts: BlogPost[]
  error: string | null
}

function formatPublishedDate(value: string): string | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function BlogPostsPanel({ posts, error }: BlogPostsPanelProps) {
  return (
    <TerminalPanel
      title="Blog"
      titleAside={
        <a
          href={EXTERNAL_LINKS.BLOG}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-terminal-text/45 no-underline transition-colors hover:text-terminal-cyan"
        >
          Alle Beiträge
          <ArrowUpRight className="size-3" aria-hidden />
        </a>
      }
    >
      <div className="p-4 sm:p-5">
        {error ? (
          <p className="font-mono text-sm text-terminal-text/60">
            Blog-Beiträge konnten gerade nicht geladen werden. Versuche es
            später erneut.
          </p>
        ) : posts.length === 0 ? (
          <p className="font-mono text-sm text-terminal-text/60">
            Noch keine Beiträge verfügbar.
          </p>
        ) : (
          <ul className="divide-y divide-terminal-window-border/70">
            {posts.map(post => (
              <BlogPostRow key={post.url} post={post} />
            ))}
          </ul>
        )}
      </div>
    </TerminalPanel>
  )
}

function BlogPostRow({ post }: { post: BlogPost }) {
  const published = formatPublishedDate(post.publishedAt)

  return (
    <li>
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'group/post flex items-start gap-3 py-3 no-underline sm:gap-3.5',
          'transition-colors hover:bg-terminal-text/3 focus-visible:bg-terminal-text/3 focus-visible:outline-none',
        )}
      >
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center border border-terminal-window-border bg-terminal-bg transition-colors group-hover/post:border-terminal-cyan/40">
          <Newspaper
            className="size-3.5 text-terminal-text/70 transition-colors group-hover/post:text-terminal-cyan/80"
            aria-hidden
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-terminal-text transition-colors group-hover/post:text-terminal-cyan">
            {post.title}
          </p>

          {(published || post.authors) && (
            <p className="mt-1 text-xs text-terminal-text/55">
              {[published, post.authors].filter(Boolean).join(' · ')}
            </p>
          )}

          {post.summary ? (
            <p className="mt-1.5 line-clamp-1 text-sm leading-relaxed text-terminal-text/70">
              {post.summary}
            </p>
          ) : null}
        </div>

        <ArrowUpRight
          className="mt-1 size-3.5 shrink-0 text-terminal-text/30 transition-colors group-hover/post:text-terminal-cyan/80"
          aria-hidden
        />
      </a>
    </li>
  )
}
