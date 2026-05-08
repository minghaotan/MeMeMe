import { createApp } from './app.js'
import { config } from './config.js'
import { getDb, closeDb } from './db/index.js'

// Initialize database on startup
getDb()
console.log('[db] SQLite initialized')

const app = createApp()

const server = app.listen(config.port, config.host, () => {
  console.log(`[server] MeMeMe server running on http://${config.host}:${config.port}`)
})

// Graceful shutdown
function shutdown() {
  console.log('\n[server] Shutting down...')
  server.close(() => {
    closeDb()
    console.log('[server] Done')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
