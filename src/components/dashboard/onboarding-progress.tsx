import { Check } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { GitHubOrgStatus } from '#/lib/constants'
import { GITHUB_ORG_STATUSES } from '#/lib/constants'
import {
  buildOnboardingSteps,
  type OnboardingStepId,
  type OnboardingStepState,
} from '#/lib/integrations/github/onboarding-status'
import { githubOrgInvitationUrl } from '#/lib/integrations/github/org-status-display'
import { cn } from '#/lib/utils'

const STEP_COMPLETE_ANIMATION_MS = 520

type OnboardingProgressProps = {
  githubConnected: boolean
  githubOrgStatus: GitHubOrgStatus | null
  githubOrg: string | null
}

export function OnboardingProgress({
  githubConnected,
  githubOrgStatus,
  githubOrg,
}: OnboardingProgressProps) {
  const awaitingInviteAcceptance =
    githubOrgStatus === GITHUB_ORG_STATUSES.INVITED

  const steps = useMemo(
    () =>
      buildOnboardingSteps({
        githubConnected,
        githubOrgStatus,
      }),
    [githubConnected, githubOrgStatus],
  )

  const [animatingStepIds, setAnimatingStepIds] = useState<
    Set<OnboardingStepId>
  >(() => new Set())
  const previousStepStatesRef = useRef<
    Partial<Record<OnboardingStepId, OnboardingStepState>>
  >({})
  const isInitialRenderRef = useRef(true)

  useEffect(() => {
    const previousStates = previousStepStatesRef.current
    const nextAnimatingStepIds = new Set<OnboardingStepId>()

    for (const step of steps) {
      const previousState = previousStates[step.id]

      if (
        !isInitialRenderRef.current &&
        step.state === 'complete' &&
        previousState !== undefined &&
        previousState !== 'complete'
      ) {
        nextAnimatingStepIds.add(step.id)
      }

      previousStates[step.id] = step.state
    }

    isInitialRenderRef.current = false

    if (nextAnimatingStepIds.size === 0) {
      return
    }

    setAnimatingStepIds(current => {
      const merged = new Set(current)
      for (const stepId of nextAnimatingStepIds) {
        merged.add(stepId)
      }
      return merged
    })

    const timeoutId = window.setTimeout(() => {
      setAnimatingStepIds(current => {
        const next = new Set(current)
        for (const stepId of nextAnimatingStepIds) {
          next.delete(stepId)
        }
        return next
      })
    }, STEP_COMPLETE_ANIMATION_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [steps])

  const currentStep =
    steps.find(step => step.state === 'current') ??
    [...steps].reverse().find(step => step.state === 'complete') ??
    steps[0]

  return (
    <div className="border border-terminal-window-border bg-terminal-window px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <ol className="flex min-w-0 flex-1 items-center justify-between gap-1 sm:gap-2">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2"
            >
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <StepIndicator
                  state={step.state}
                  index={index + 1}
                  animate={animatingStepIds.has(step.id)}
                  pulse={
                    awaitingInviteAcceptance &&
                    step.id === 'in-org' &&
                    step.state === 'current'
                  }
                />
                <span
                  className={cn(
                    'w-full truncate text-center font-mono text-[10px] uppercase tracking-wide transition-colors duration-300 sm:text-xs',
                    step.state === 'complete' && 'text-terminal-lightGreen',
                    step.state === 'current' && 'text-terminal-text',
                    step.state === 'upcoming' && 'text-terminal-text/40',
                    awaitingInviteAcceptance &&
                      step.id === 'in-org' &&
                      step.state === 'current' &&
                      'text-terminal-lightGreen',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mb-5 h-px flex-1 transition-colors duration-500',
                    step.state === 'complete'
                      ? 'bg-terminal-cyan/40'
                      : 'bg-terminal-window-border',
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>

        <div
          className={cn(
            'shrink-0 space-y-2 border-t border-terminal-window-border pt-3 lg:max-w-xs lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0',
            awaitingInviteAcceptance && 'text-terminal-lightGreen/90',
          )}
        >
          <p className="font-mono text-xs text-terminal-text/55">
            {currentStep.hint}
          </p>
          {awaitingInviteAcceptance && githubOrg ? (
            <a
              href={githubOrgInvitationUrl(githubOrg)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-terminal-cyan transition-colors hover:text-terminal-lightGreen"
            >
              Einladung in GitHub öffnen
            </a>
          ) : null}
          {awaitingInviteAcceptance ? (
            <p className="font-mono text-[10px] leading-relaxed text-terminal-text/35">
              Die Statusaktualisierung erfolgt automatisch und kann nach Annahme
              der Einladung bis zu 20 Minuten dauern.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StepIndicator({
  state,
  index,
  animate,
  pulse,
}: {
  state: OnboardingStepState
  index: number
  animate: boolean
  pulse?: boolean
}) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center border font-mono text-[11px] font-semibold transition-colors duration-300',
        state === 'complete' &&
          'border-terminal-cyan/40 bg-terminal-cyan/10 text-terminal-lightGreen',
        state === 'current' &&
          'border-terminal-cyan bg-terminal-card text-terminal-text',
        state === 'upcoming' &&
          'border-terminal-window-border bg-terminal-bg text-terminal-text/30',
        animate && 'onboarding-step-animate animate-onboarding-step-complete',
        pulse && 'onboarding-step-pulse animate-onboarding-step-pulse',
      )}
    >
      {state === 'complete' ? (
        <Check
          className={cn(
            'size-3.5',
            animate && 'onboarding-check-animate animate-onboarding-check-in',
          )}
        />
      ) : (
        index
      )}
    </div>
  )
}
