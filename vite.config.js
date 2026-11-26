import { defineConfig } from 'vite';

export default defineConfig({
  // Caminhos relativos: o site fica em /apocalipse-horario-comercial/ no GitHub Pages.
  base: './',
  define: {
    __DATA_BUILD__: JSON.stringify(new Date().toISOString())
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  },
  test: {
    include: ['tests/**/*.test.js']
  }
});
