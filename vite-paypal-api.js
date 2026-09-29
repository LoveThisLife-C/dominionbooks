import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFileSync, existsSync } from 'node:fs'

const root = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function paypalApiPlugin() {
  return {
    name: 'dominion-paypal-api',
    configureServer(server) {
      loadEnvFile(resolve(root, '.env.local'))
      loadEnvFile(resolve(root, '.env'))

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        if (!url.startsWith('/api/')) return next()

        const map = {
          '/api/paypal-config': './api/paypal-config.js',
          '/api/create-order': './api/create-order.js',
          '/api/capture-order': './api/capture-order.js',
          '/api/contact': './api/contact.js',
        }
        const rel = map[url]
        if (!rel) return next()

        try {
          const mod = await import(`${pathToFileURL(resolve(root, rel)).href}?t=${Date.now()}`)
          const handler = mod.default
          await handler(req, res)
        } catch (err) {
          console.error('[paypal-api]', err)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message || 'API error' }))
          }
        }
      })
    },
  }
}

export default paypalApiPlugin
