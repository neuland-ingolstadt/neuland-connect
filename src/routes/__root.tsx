import { TanStackDevtools } from '@tanstack/react-devtools'
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { AppErrorPage } from '#/components/errors/app-error-page'
import { AppNotFoundPage } from '#/components/errors/app-not-found-page'
import { Providers } from '#/components/providers'
import { clientShellScript } from '#/lib/client-shell'
import { APP_NAME } from '#/lib/constants'
import type { CurrentUser } from '#/server/get-current-user'
import appCss from '../styles.css?url'

const FONTS_CSS =
  'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Mono:wght@400;500;600;700&display=swap'

export type RouterContext = {
  user: CurrentUser | null
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: APP_NAME },
      {
        name: 'theme-color',
        content: '#020302',
        media: '(prefers-color-scheme: dark)',
      },
      {
        name: 'theme-color',
        content: '#f5f8f5',
        media: '(prefers-color-scheme: light)',
      },
      {
        name: 'description',
        content:
          'Neuland Connect – das Mitgliederportal von Neuland Ingolstadt.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.png', type: 'image/png' },
      {
        rel: 'apple-touch-icon',
        href: '/web-app-manifest-192x192.png',
        sizes: '192x192',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
    ],
  }),
  shellComponent: RootDocument,
  errorComponent: AppErrorPage,
  notFoundComponent: AppNotFoundPage,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        <HeadContent />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preload" href={FONTS_CSS} as="style" />
        <link
          rel="stylesheet"
          href={FONTS_CSS}
          media="print"
          onLoad={event => {
            event.currentTarget.media = 'all'
          }}
        />
        <script dangerouslySetInnerHTML={{ __html: clientShellScript }} />
      </head>
      <body className="min-h-screen bg-terminal-bg font-sans text-terminal-text antialiased">
        <Providers>
          {children}
          {import.meta.env.DEV ? (
            <TanStackDevtools
              config={{ position: 'bottom-right' }}
              plugins={[
                {
                  name: 'Tanstack Router',
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          ) : null}
        </Providers>
        <Scripts />
      </body>
    </html>
  )
}
