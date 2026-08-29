import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

export default defineConfig({
  plugins: [react()],
  // The footer shows the running version; package.json is the single source of it.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Extension pages are served from the extension root, so absolute asset paths resolve.
  base: '/',
  server: { port: 5174, strictPort: true },
  build: {
    outDir: 'dist',
    // AMO reviewers read the shipped code. Unminified costs a little size and saves
    // a review round-trip; it is also what the source-zip is compared against.
    minify: false,
    rollupOptions: { input: 'newtab.html' },
  },
})
