import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { db } from './db/index.js'

const app = createApp()

describe('probe routes', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET /api/health answers 200 whatever the database state', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })

  it('GET /api/ready answers 200 when the database answers a query', async () => {
    const response = await request(app).get('/api/ready')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ready')
    expect(response.body.database).toBe('connected')
  })

  it('GET /api/ready answers 503 when the database query fails', async () => {
    vi.spyOn(db, 'prepare').mockImplementationOnce(() => {
      throw new Error('database is locked')
    })

    const response = await request(app).get('/api/ready')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'not_ready', database: 'error' })
  })
})
