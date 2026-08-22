import { Link } from '@tanstack/react-router'
import { Shield } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { NeulandPalm } from '#/components/brand/neuland-palm'
import { DiscordIcon } from '#/components/icons/discord-icon'
import { Button } from '#/components/ui/button'
import { ROUTES } from '#/lib/constants'
import { cn } from '#/lib/utils'

type SetupExplainerProps = {
  firstName: string
  onFinished: () => void
  onExitStart?: () => void
  finishLabel?: string
}

export type LinkedAccountState = {
  githubConnected: boolean
  discordOAuthEnabled: boolean
  discordConnected: boolean
}

export function hasNoLinkedAccounts(user: LinkedAccountState): boolean {
  return (
    !user.githubConnected &&
    (!user.discordOAuthEnabled || !user.discordConnected)
  )
}

/** Auto-play after login only. Replay is always available from the footer. */
export function shouldAutoShowSetupExplainer(input: {
  intro: boolean
  unconnected: boolean
}): boolean {
  return input.intro && input.unconnected
}

type ExplainerSlide = {
  id: string
  kicker: string
  title: string
  body: string
  icon: 'palm' | 'discord' | 'next' | 'privacy'
  href?: string
}

const SLIDE_MS = 3900

export function SetupExplainer({
  firstName,
  onFinished,
  onExitStart,
  finishLabel = 'Fertig',
}: SetupExplainerProps) {
  const titleId = useId()
  const slides = useMemo<ExplainerSlide[]>(() => {
    const items: ExplainerSlide[] = [
      {
        id: 'welcome',
        kicker: 'willkommen',
        title: `Willkommen, ${firstName}`,
        body: 'Für deinen Zugang zu unseren Diensten, verknüpfe deine Konten.',
        icon: 'palm',
      },
      {
        id: 'Discord & GitHub',
        kicker: 'projektzugang',
        title: 'Discord & GitHub',
        body: 'Zugriff auf Repositories und Projektkanäle erhalten.',
        icon: 'discord',
      },
      {
        id: 'next',
        kicker: 'Neuland Next',
        title: 'Mitgliedsausweis',
        body: 'In unserer App mit deinem Neuland-Konto anmelden.',
        icon: 'next',
      },
      {
        id: 'datenschutz',
        kicker: 'über',
        title: 'Datenschutz',
        body: 'Wir haben keinen Zugriff auf deine verknüpften Accounts oder Passwörter.',
        icon: 'privacy',
        href: ROUTES.DATENSCHUTZ,
      },
    ]

    return items
  }, [firstName])

  const [index, setIndex] = useState(0)
  const [exiting, setExiting] = useState(false)
  const finishedRef = useRef(false)
  const slide = slides[index]
  const isLast = index === slides.length - 1

  const complete = useCallback(() => {
    if (finishedRef.current) {
      return
    }

    finishedRef.current = true
    onFinished()
  }, [onFinished])

  const finish = useCallback(() => {
    if (exiting || finishedRef.current) {
      return
    }

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (reducedMotion) {
      onExitStart?.()
      complete()
      return
    }

    onExitStart?.()
    setExiting(true)
  }, [complete, exiting, onExitStart])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  useEffect(() => {
    if (exiting) {
      return
    }

    if (index >= slides.length - 1) {
      return
    }

    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (reduced) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIndex(current => Math.min(current + 1, slides.length - 1))
    }, SLIDE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [exiting, index, slides.length])

  useEffect(() => {
    if (!exiting) {
      return
    }

    const timeoutId = window.setTimeout(complete, 780)
    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [complete, exiting])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        finish()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [finish])

  function advance() {
    if (isLast) {
      finish()
      return
    }

    setIndex(current => current + 1)
  }

  return (
    <div
      className={cn('setup-explainer', exiting && 'setup-explainer--exit')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onAnimationEnd={event => {
        if (
          exiting &&
          event.animationName === 'setup-explainer-exit' &&
          event.target === event.currentTarget
        ) {
          complete()
        }
      }}
    >
      <div className="pointer-events-none absolute inset-0 neuland-grid-bg neuland-glow" />

      <div className="relative z-10 flex min-h-full flex-col items-center justify-center px-4 py-10">
        <div className="setup-explainer-panel relative w-full max-w-lg overflow-hidden border border-terminal-window-border bg-terminal-window">
          <span className="connect-boot-corner connect-boot-corner--tl" />
          <span className="connect-boot-corner connect-boot-corner--tr" />
          <span className="connect-boot-corner connect-boot-corner--bl" />
          <span className="connect-boot-corner connect-boot-corner--br" />

          <div className="relative border-b border-terminal-window-border/70 bg-terminal-window-title/80 px-4 py-1.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-terminal-text/65">
              <span className="text-terminal-cyan/75">//</span> einführung
            </p>
          </div>

          <div className="relative space-y-8 px-6 py-8 sm:px-8">
            <div key={slide.id} className="setup-explainer-slide space-y-5">
              <div className="flex justify-center">
                <div className="setup-explainer-icon flex size-16 items-center justify-center border border-terminal-window-border bg-terminal-card">
                  {slide.icon === 'palm' || slide.icon === 'next' ? (
                    <NeulandPalm className="h-9 w-auto text-terminal-text" />
                  ) : null}
                  {slide.icon === 'discord' ? (
                    <DiscordIcon className="size-8 text-terminal-text" />
                  ) : null}
                  {slide.icon === 'privacy' ? (
                    <Shield
                      className="size-8 text-terminal-text"
                      strokeWidth={1.6}
                    />
                  ) : null}
                </div>
              </div>

              <div className="text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-terminal-lightGreen">
                  {slide.kicker}
                </p>
                <h2
                  id={titleId}
                  className="mt-2 font-mono text-xl font-semibold tracking-tight text-terminal-lightGreen sm:text-2xl"
                >
                  {slide.title}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-terminal-text/65">
                  {slide.body}
                </p>
                {slide.href ? (
                  slide.href.startsWith('/') ? (
                    <Link
                      to={slide.href}
                      className="mt-3 inline-block font-mono text-xs text-terminal-cyan transition-colors hover:text-terminal-highlight"
                    >
                      Datenschutzerklärung →
                    </Link>
                  ) : (
                    <a
                      href={slide.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block font-mono text-xs text-terminal-cyan transition-colors hover:text-terminal-highlight"
                    >
                      Datenschutzerklärung →
                    </a>
                  )
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2" aria-hidden>
              {slides.map((item, slideIndex) => (
                <span
                  key={item.id}
                  className={cn(
                    'h-1 w-6 transition-colors',
                    slideIndex === index
                      ? 'bg-terminal-cyan'
                      : slideIndex < index
                        ? 'bg-terminal-cyan/45'
                        : 'bg-terminal-window-border',
                  )}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={advance} autoFocus>
                {isLast ? finishLabel : 'Weiter'}
              </Button>
              {isLast ? null : (
                <Button variant="ghost" size="lg" onClick={finish}>
                  Überspringen
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
