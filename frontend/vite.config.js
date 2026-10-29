import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Tests run in a fixed, non-UTC timezone so date bugs show up.
process.env.TZ = 'America/Los_Angeles'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    restoreMocks: true,
  },
})
