import { Button } from '#/components/ui/button'
import { useI18n } from '#/lib/i18n/locale-context'
import { otherLocale } from '#/lib/i18n/messages'
import { cn } from '#/lib/utils'

export function LanguageToggle({
  className,
  size = 'icon-sm',
  variant = 'outline',
}: {
  className?: string
  size?: 'sm' | 'icon-sm'
  variant?: 'outline' | 'ghost'
}) {
  const { locale, toggleLocale, t } = useI18n()
  const next = otherLocale(locale)

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggleLocale}
      aria-label={`${t('header.language')}: ${t(`header.language.${next}`)}`}
      title={t(`header.language.${next}`)}
      className={cn('font-mono text-[11px] tracking-wide', className)}
    >
      {next.toUpperCase()}
    </Button>
  )
}
