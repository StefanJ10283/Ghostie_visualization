import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Only measure coverage for pure UI components — pages, context, hooks
      // and auth all depend on API calls / router and require integration tests.
      include: ['src/components/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/main.jsx',
        'src/api/**',
        'src/pages/**',
        'src/context/**',
        'src/hooks/**',
        'src/auth/**',
        'src/shared-theme/**',
      ],
      thresholds: {
        lines: 45,
        functions: 30,
        branches: 50,
        statements: 45,
      },
    },
  },
})
