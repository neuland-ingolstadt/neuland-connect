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

  return (
    <div className="flex items-center gap-1.5">
      {steps.map((step, index) => (
        <span
          key={step.id}
          className={cn(
            'size-1.5 shrink-0 rounded-full transition-colors',
            step.complete && 'bg-terminal-cyan/75',
            !step.complete &&
              index === currentIndex &&
              'bg-terminal-cyan/30 ring-1 ring-terminal-cyan/40',
            !step.complete &&
              index !== currentIndex &&
              'bg-terminal-window-border',
          )}
        />
      ))}
      <span
        className={cn(
          'font-mono text-[10px] tabular-nums',
          isComplete ? 'text-terminal-lightGreen/55' : 'text-terminal-text/35',
        )}
      >
        {completedCount}/{total}
      </span>
    </div>
  )
}
