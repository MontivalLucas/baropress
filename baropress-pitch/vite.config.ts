import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tw from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [react(), tw(), viteSingleFile()],
  // O pitch usa Tailwind 4 via Vite; não herdar o PostCSS do aplicativo desktop.
  css: { postcss: { plugins: [] } },
})
