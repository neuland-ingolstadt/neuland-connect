import { ArrowUpRight, Clock3, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  isRecentPastEvent,
  sortEvents,
} from '#/lib/campus-life/format'
import type { CampusLifeEvent } from '#/lib/campus-life/types'
import { cn } from '#/lib/utils'

type TimeFilter = 'upcoming' | 'past'

type EventsPanelProps = {
  events: CampusLifeEvent[]
  error: string | null
}

function FilterButton({
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
        'cursor-pointer px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors',
        active
          ? 'border border-terminal-cyan/40 bg-terminal-cyan/15 text-terminal-cyan'
          : 'border border-terminal-window-border bg-terminal-card text-terminal-text/55 hover:border-terminal-cyan/30 hover:text-terminal-text',
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

export function EventsPanel({ events, error }: EventsPanelProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('upcoming')
  const [selectedEvent, setSelectedEvent] = useState<CampusLifeEvent | null>(
    null,
  )

  const filteredEvents = useMemo(() => {
    const now = Date.now()
    const visible = events.filter(event => {
      const past = isEventPast(event, now)
      return timeFilter === 'upcoming'
        ? !past
        : isRecentPastEvent(event, 2, now)
    })

    return sortEvents(visible, timeFilter)
  }, [events, timeFilter])

  return (
    <TerminalPanel
      title="Events"
      subtitle={`${filteredEvents.length} ${filteredEvents.length === 1 ? 'Termin' : 'Termine'}`}
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterButton
            active={timeFilter === 'upcoming'}
            label="Bevorstehend"
            onClick={() => setTimeFilter('upcoming')}
          />
          <FilterButton
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
            {filteredEvents.map(event => (
              <EventRow
                key={event.id}
                event={event}
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

function EventRow({
  event,
  onSelect,
}: {
  event: CampusLifeEvent
  onSelect: () => void
}) {
  const dayParts = formatEventDayParts(event)

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full cursor-pointer gap-3 py-3.5 text-left sm:gap-4',
          'transition-colors hover:bg-terminal-cyan/[0.04] focus-visible:bg-terminal-cyan/[0.04] focus-visible:outline-none',
        )}
      >
        <div className="flex size-12 shrink-0 flex-col items-center justify-center border border-terminal-window-border bg-terminal-card">
          {dayParts ? (
            <>
              <span className="font-mono text-sm font-semibold leading-none text-terminal-lightGreen">
                {dayParts.day}
              </span>
              <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-terminal-text/45">
                {dayParts.month}
              </span>
            </>
          ) : (
            <Clock3 className="size-4 text-terminal-text/40" aria-hidden />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-terminal-lightGreen">
            {event.title}
          </p>

          <p className="mt-1 text-xs text-terminal-text/55">
            {formatEventDateRange(event)}
            {event.location ? ` · ${event.location}` : null}
          </p>

          {event.description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-terminal-text/70">
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
            <DialogTitle className="text-lg">{event.title}</DialogTitle>
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
