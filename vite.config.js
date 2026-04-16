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
        'src/components/Layout.jsx',
        'src/components/BusinessPicker.jsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
