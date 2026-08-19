import { execSync } from 'node:child_process'

import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

function resolveBuildCommit(): string {
  if (process.env.VITE_BUILD_COMMIT) {
    return process.env.VITE_BUILD_COMMIT
  }

  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'dev'
  }
}

const buildCommit = resolveBuildCommit()

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  define: {
    'import.meta.env.VITE_BUILD_COMMIT': JSON.stringify(buildCommit),
  },
})

export default config
