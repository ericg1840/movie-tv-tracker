/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    fs: {
      strict: false,
      allow: [rootDir],
    },
  },
  test: {
    environment: 'jsdom',
    // omdb.ts/tmdb.ts/supabase.ts throw at import time if these are unset,
    // so unit tests need placeholder values rather than real credentials.
    env: {
      VITE_OMDB_API_KEY: 'test-omdb-key',
      VITE_TMDB_API_KEY: 'test-tmdb-key',
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
})
