import { ArrowUpRight, Clock3, Globe, MapPin } from 'lucide-react'
import { type CSSProperties, useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { TerminalPanel } from '#/components/ui/terminal-panel'
import {
  formatEventDateRange,
  formatEventDayParts,
  isEventPast,
  isEventToday,
  sortEvents,
} from '#/lib/campus-life/format'
import type { CampusLifeEvent } from '#/lib/campus-life/types'
import { cn } from '#/lib/utils'

type TimeFilter = 'upcoming' | 'past'

type EventsPanelProps = {
  events: CampusLifeEvent[]
  error: string | null
}

function FilterSegment({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 cursor-pointer px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors',
        active
          ? 'bg-terminal-cyan/10 text-terminal-lightGreen'
          : 'text-terminal-text/50 hover:text-terminal-text/75',
      )}
    >
      {label}
    </button>
  )
}

function errorMessage(error: string): string {
  if (error === 'not_configured') {
    return 'Der Events-Kalender ist noch nicht konfiguriert.'
  }

  return 'Events konnten gerade nicht geladen werden. Versuche es später erneut.'
}

function PublicEventIcon({ className }: { className?: string }) {
  return (
    <span
      role="img"
      title="Öffentlich"
      aria-label="Öffentlich"
      className={cn('inline-flex shrink-0 text-terminal-text/45', className)}
    >
      <Globe className="size-3.5" aria-hidden />
    </span>
  )
}

export function EventsPanel({ events, error }: EventsPanelProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [selectedEvent, setSelectedEvent] = useState<CampusLifeEvent | null>(
    null,
  )

  const filteredEvents = useMemo(() => {
    const now = Date.now()
    const visible = events.filter(event => {
      const past = isEventPast(event, now)
      return timeFilter === 'upcoming' ? !past : past
    })

    return sortEvents(visible, timeFilter)
  }, [events, timeFilter])

  return (
    <TerminalPanel title="Events">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="inline-flex w-full max-w-xs border border-terminal-window-border/70 p-0.5 sm:w-auto">
          <FilterSegment
            active={timeFilter === 'upcoming'}
            label="Bevorstehend"
            onClick={() => setTimeFilter('upcoming')}
          />
          <FilterSegment
            active={timeFilter === 'past'}
            label="Vergangen"
            onClick={() => setTimeFilter('past')}
          />
        </div>

        {error ? (
          <p className="font-mono text-sm text-terminal-text/60">
            {errorMessage(error)}
          </p>
        ) : filteredEvents.length === 0 ? (
          <p className="font-mono text-sm text-terminal-text/60">
            Keine Events für diese Filter.
          </p>
        ) : (
          <ul className="divide-y divide-terminal-window-border/70 border-t border-terminal-window-border/70">
            {filteredEvents.map((event, index) => (
              <EventRow
                key={`${timeFilter}-${event.id}`}
                event={event}
                index={index}
                onSelect={() => setSelectedEvent(event)}
              />
            ))}
          </ul>
        )}
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        onOpenChange={open => {
          if (!open) {
            setSelectedEvent(null)
          }
        }}
      />
    </TerminalPanel>
  )
}

function TodayBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="default"
      className={cn(
        'shrink-0 px-1.5 py-px text-[9px] tracking-[0.14em]',
        className,
      )}
    >
      Heute
    </Badge>
  )
}

const REVEAL_STEP_MS = 45
const REVEAL_MAX_INDEX = 10

function EventRow({
  event,
  index,
  onSelect,
}: {
  event: CampusLifeEvent
  index: number
  onSelect: () => void
}) {
  const dayParts = formatEventDayParts(event)
  const isToday = isEventToday(event)
  const revealDelay = Math.min(index, REVEAL_MAX_INDEX) * REVEAL_STEP_MS

  return (
    <li
      className="list-reveal"
      style={{ '--reveal-delay': `${revealDelay}ms` } as CSSProperties}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full min-w-0 cursor-pointer gap-3 py-3.5 text-left sm:gap-4',
          'transition-colors hover:bg-terminal-text/3 focus-visible:bg-terminal-text/3 focus-visible:outline-none',
        )}
      >
        <div
          className={cn(
            'flex w-11 shrink-0 flex-col items-center justify-center border-l-2 pl-2.5',
            isToday ? 'border-terminal-cyan' : 'border-terminal-cyan/30',
          )}
        >
          {dayParts ? (
            <>
              <span
                className={cn(
                  'font-mono text-sm font-semibold leading-none',
                  isToday ? 'text-terminal-cyan' : 'text-terminal-text',
                )}
              >
                {dayParts.day}
              </span>
              <span
                className={cn(
                  'mt-1 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]',
                  isToday ? 'text-terminal-cyan' : 'text-terminal-text/40',
                )}
              >
                {isToday ? 'Heute' : dayParts.month}
              </span>
            </>
          ) : (
            <Clock3 className="size-4 text-terminal-text/40" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-terminal-text">
            {isToday ? <TodayBadge /> : null}
            <span className="min-w-0 truncate">{event.title}</span>
            {event.visibility === 'public' ? <PublicEventIcon /> : null}
          </div>

          <p className="mt-1 break-words text-xs text-terminal-text/55">
            {formatEventDateRange(event)}
            {event.location ? ` · ${event.location}` : null}
          </p>

          {event.description ? (
            <p className="mt-2 line-clamp-1 text-sm leading-relaxed text-terminal-text/70">
              {event.description}
            </p>
          ) : null}
        </div>
      </button>
    </li>
  )
}

function EventDetailsDialog({
  event,
  onOpenChange,
}: {
  event: CampusLifeEvent | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      {event ? (
        <DialogContent className="max-h-[min(90vh,40rem)] overflow-y-auto">
          <DialogHeader>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-terminal-text/45">
              Event
            </p>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="min-w-0">{event.title}</span>
              {isEventToday(event) ? <TodayBadge /> : null}
              {event.visibility === 'public' ? <PublicEventIcon /> : null}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="flex items-start gap-2 text-sm text-terminal-text/80">
              <Clock3
                className="mt-0.5 size-4 shrink-0 text-terminal-text/45"
                aria-hidden
              />
              <span>{formatEventDateRange(event)}</span>
            </p>
            {event.location ? (
              <p className="flex items-start gap-2 text-sm text-terminal-text/80">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-terminal-text/45"
                  aria-hidden
                />
                <span>{event.location}</span>
              </p>
            ) : null}
            <DialogDescription className="whitespace-pre-wrap text-sm leading-relaxed text-terminal-text/70">
              {event.description || 'Keine Beschreibung vorhanden.'}
            </DialogDescription>
          </div>

          <DialogFooter>
            {event.eventUrl ? (
              <Button variant="outline" asChild>
                <a
                  href={event.eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mehr Infos
                  <ArrowUpRight />
                </a>
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
