import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        research: resolve(__dirname, 'research.html'),
        team: resolve(__dirname, 'team.html'),
        publications: resolve(__dirname, 'publications.html'),
        admin: resolve(__dirname, 'admin.html'),
      }
    }
  }
})
