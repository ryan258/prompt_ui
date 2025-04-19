// Build commandPaletteEntry.tsx as a standalone IIFE for Chrome content script usage
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/content/commandPaletteEntry.tsx'],
  bundle: true,
  outfile: 'dist/commandPaletteEntry.js',
  format: 'iife',
  target: ['chrome58'],
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.ts': 'ts', '.tsx': 'tsx' }
}).catch(() => process.exit(1));
