import express from 'express'
import cors from 'cors'
import { pinoHttp } from 'pino-http'
import eventsRouter from './routes/events.js'
import relationshipsRouter from './routes/relationships.js'
import tagsRouter from './routes/tags.js'
import { db } from './db/index.js'
import { logger } from './lib/logger.js'
import { sendError } from './errors.js'

type HttpError = Error & { status?: number; expose?: boolean }

const isProduction = process.env.NODE_ENV === 'production'

export function createApp() {
  const app = express()

  app.use(
    pinoHttp({
      logger,
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error'
        if (res.statusCode >= 400) return 'warn'
        return 'info'
      },
    }),
  )

  if (!isProduction) {
    app.use(cors())
  }
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })

  app.get('/api/ready', (_req, res) => {
    try {
      const dbCheck = db.prepare('SELECT 1 as ok').get() as { ok: number } | undefined
      if (dbCheck?.ok !== 1) {
        res.status(503).json({ status: 'not_ready', database: 'unexpected_response' })
        return
      }
      res.json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      logger.error({ err }, 'readiness probe failed')
      res.status(503).json({ status: 'not_ready', database: 'error' })
    }
  })

  app.use('/api/events', eventsRouter)
  app.use('/api/relationships', relationshipsRouter)
  app.use('/api/tags', tagsRouter)

  app.use('/api', (req, res) => {
    sendError(res, 404, `No route answers ${req.method} ${req.originalUrl}`)
  })

  // A body express.json cannot parse arrives as a 4xx error marked safe to show.
  app.use((err: HttpError, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err.expose && err.status !== undefined && err.status < 500) {
      sendError(res, err.status, err.message)
      return
    }
    logger.error({ err }, 'unhandled error')
    sendError(res, 500, 'Internal server error')
  })

  return app
}
