import { useI18n } from '#/lib/i18n/locale-context'
import type { IntegrationProgressStep } from '#/lib/integrations/github/integration-progress'
import { cn } from '#/lib/utils'

type IntegrationProgressInlineProps = {
  steps: IntegrationProgressStep[]
  isComplete?: boolean
}

export function IntegrationProgressInline({
  steps,
  isComplete = false,
}: IntegrationProgressInlineProps) {
  const completedCount = steps.filter(step => step.complete).length
  const total = steps.length
  const currentIndex = steps.findIndex(step => !step.complete)
  const { t } = useI18n()

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={t('progress.steps', { completed: completedCount, total })}
    >
      {steps.map((step, index) => (
        <span
          key={step.id}
          className={cn(
            'size-1.5 shrink-0 rounded-full transition-colors',
            step.complete && 'bg-terminal-green/80',
            !step.complete &&
              index === currentIndex &&
              'bg-terminal-green/30 ring-1 ring-terminal-green/40',
            !step.complete &&
              index !== currentIndex &&
              'bg-terminal-window-border',
          )}
        />
      ))}
      <span
        className={cn(
          'text-[11px] font-medium tabular-nums',
          isComplete ? 'text-terminal-text/55' : 'text-terminal-text/40',
        )}
      >
        {completedCount}/{total}
      </span>
    </div>
  )
}
