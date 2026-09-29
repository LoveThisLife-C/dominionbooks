import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const pages = [
  'index',
  'book',
  'catalog',
  'sample',
  'reviews',
  'author',
  'contact',
  'order',
]

export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((name) => [
          name,
          resolve(root, name === 'index' ? 'index.html' : `${name}.html`),
        ]),
      ),
    },
  },
})
