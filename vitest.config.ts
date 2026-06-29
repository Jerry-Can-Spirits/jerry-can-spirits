import { defineConfig } from 'vitest/config'
import path from 'node:path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Stub Next.js and server-only modules that can't run in Vitest
      'server-only': path.resolve(__dirname, './tests/unit/__mocks__/server-only.ts'),
      'next/cache': path.resolve(__dirname, './tests/unit/__mocks__/next-cache.ts'),
      'next/navigation': path.resolve(__dirname, './tests/unit/__mocks__/next-navigation.ts'),
      '@opennextjs/cloudflare': path.resolve(__dirname, './tests/unit/__mocks__/opennext-cloudflare.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    environmentMatchGlobs: [['tests/unit/components/**', 'jsdom']],
    setupFiles: ['tests/unit/setup-component.ts'],
  },
})
