import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidebar: 'index.html',
        background: 'src/background/index.ts',
        content: 'src/content/index.ts',
        commandPaletteEntry: 'src/content/commandPaletteEntry.tsx'
      },
      output: {
        entryFileNames: assetInfo => {
          if (assetInfo.name === 'background') return 'background.js';
          if (assetInfo.name === 'content') return 'content.js';
          if (assetInfo.name === 'commandPaletteEntry') return 'commandPaletteEntry.js';
          return '[name].js';
        }
      }
    }
  }
});