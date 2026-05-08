import express from 'express'
import cors from 'cors'
import { errorHandler } from './middleware/error-handler.js'
import authRoutes from './routes/auth.js'
import syncRoutes from './routes/sync.js'
import mediaRoutes from './routes/media.js'
import adminRoutes from './routes/admin.js'
import deviceRoutes from './routes/device.js'

export function createApp(): express.Express {
  const app = express()

  // Middleware
  app.use(cors())
  app.use(express.json({ limit: '10mb' }))

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() })
  })

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/sync', syncRoutes)
  app.use('/api/media', mediaRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/device', deviceRoutes)

  // Error handler (must be last)
  app.use(errorHandler)

  return app
}
