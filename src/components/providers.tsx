import { Toaster } from 'sonner'
import { I18nProvider } from '#/lib/i18n/locale-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <Toaster richColors position="bottom-right" closeButton />
    </I18nProvider>
  )
}
