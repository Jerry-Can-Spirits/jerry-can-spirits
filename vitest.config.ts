import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // tsconfig sets jsx: "preserve" because Next runs its own JSX transform. For
  // .tsx files that setting is inherited by the transform, so Vite is handed
  // untransformed JSX and any test importing a component fails to parse before
  // it runs. Naming the runtime here overrides it for the test build only,
  // leaving tsconfig.json — and so the Next build — untouched. This is the oxc
  // option, not the esbuild one: Vitest 4 runs on oxc and logs that it is
  // ignoring esbuild settings. Not @vitejs/plugin-react, because that package
  // is present only transitively via the Sanity CLI and CI would not have it.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
})
