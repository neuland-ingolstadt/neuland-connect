import { Laptop, MoonStar, SunMedium } from 'lucide-react'
import { Button } from '#/components/ui/button'

export function ThemeToggle() {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      data-theme-toggle
      data-theme-mode="system"
      aria-label="System-Design"
      title="System-Design"
    >
      <Laptop data-theme-icon="system" aria-hidden />
      <SunMedium data-theme-icon="light" className="hidden" aria-hidden />
      <MoonStar data-theme-icon="dark" className="hidden" aria-hidden />
    </Button>
  )
}
