import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app.js'

const app = createApp()

describe('Events API', () => {
  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const response = await request(app).post('/api/events').send({
        id: 'test-event',
        title: 'Test Event',
        date_start: '1900',
        type: 'event',
      })

      expect(response.status).toBe(201)
      expect(response.body.id).toBe('test-event')
      expect(response.body.title).toBe('Test Event')
    })

    it('should create an event with tags', async () => {
      const response = await request(app)
        .post('/api/events')
        .send({
          id: 'tagged-event',
          title: 'Tagged Event',
          tags: ['philosophy', 'history'],
        })

      expect(response.status).toBe(201)

      const getResponse = await request(app).get('/api/events/tagged-event')
      expect(getResponse.body.tags).toHaveLength(2)
      expect(getResponse.body.tags.map((t: { name: string }) => t.name)).toContain('philosophy')
    })

    it('should return 400 if id is missing', async () => {
      const response = await request(app).post('/api/events').send({
        title: 'No ID Event',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toContain('id')
    })

    it('should return 409 if event id already exists', async () => {
      await request(app).post('/api/events').send({
        id: 'duplicate',
        title: 'First',
      })

      const response = await request(app).post('/api/events').send({
        id: 'duplicate',
        title: 'Second',
      })

      expect(response.status).toBe(409)
    })
  })

  describe('GET /api/events', () => {
    it('should return empty array when no events', async () => {
      const response = await request(app).get('/api/events')

      expect(response.status).toBe(200)
      expect(response.body).toEqual([])
    })

    it('should order and filter by year, with BCE years negative', async () => {
      await request(app).post('/api/events').send({ id: 'modern', title: 'Modern', date_start: '1886' })
      await request(app).post('/api/events').send({ id: 'late-antique', title: 'Late antique', date_start: '476' })
      await request(app).post('/api/events').send({ id: 'classical', title: 'Classical', date_start: '470', is_bce: true })

      const all = await request(app).get('/api/events')
      expect(all.body.map((e: { id: string }) => e.id)).toEqual(['classical', 'late-antique', 'modern'])

      const window = await request(app).get('/api/events?after=0&before=1000')
      expect(window.body.map((e: { id: string }) => e.id)).toEqual(['late-antique'])
    })

    it('should filter by type', async () => {
      await request(app).post('/api/events').send({ id: 'b1', title: 'Book', type: 'book' })
      await request(app).post('/api/events').send({ id: 'e1', title: 'Event', type: 'event' })

      const response = await request(app).get('/api/events?type=book')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].type).toBe('book')
    })
  })

  describe('GET /api/events/:id', () => {
    it('should return event with relationships', async () => {
      await request(app).post('/api/events').send({
        id: 'main-event',
        title: 'Main Event',
        content: '<p>Test content</p>',
      })

      const response = await request(app).get('/api/events/main-event')

      expect(response.status).toBe(200)
      expect(response.body.id).toBe('main-event')
      expect(response.body.tags).toEqual([])
      expect(response.body.relationships).toEqual([])
      expect(response.body.inverse_relationships).toEqual([])
    })

    it('should return 404 for non-existent event', async () => {
      const response = await request(app).get('/api/events/non-existent')

      expect(response.status).toBe(404)
    })
  })

  describe('PUT /api/events/:id', () => {
    it('should update an event', async () => {
      await request(app).post('/api/events').send({ id: 'update-me', title: 'Original' })

      const response = await request(app).put('/api/events/update-me').send({ title: 'Updated Title' })

      expect(response.status).toBe(200)
      expect(response.body.title).toBe('Updated Title')
    })

    it('should return 404 for non-existent event', async () => {
      const response = await request(app).put('/api/events/non-existent').send({ title: 'Updated' })

      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      await request(app).post('/api/events').send({ id: 'delete-me', title: 'To Delete' })

      const response = await request(app).delete('/api/events/delete-me')
      expect(response.status).toBe(204)

      const getResponse = await request(app).get('/api/events/delete-me')
      expect(getResponse.status).toBe(404)
    })

    it('should return 404 for non-existent event', async () => {
      const response = await request(app).delete('/api/events/non-existent')
      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/events/search', () => {
    it('should search events by title', async () => {
      await request(app).post('/api/events').send({ id: 'n1', title: 'Nietzsche Book' })
      await request(app).post('/api/events').send({ id: 'm1', title: 'Marx Manifesto' })

      const response = await request(app).get('/api/events/search?q=nietzsche')

      expect(response.status).toBe(200)
      expect(response.body).toHaveLength(1)
      expect(response.body[0].title).toBe('Nietzsche Book')
    })

    it('should return 400 if query is missing', async () => {
      const response = await request(app).get('/api/events/search')

      expect(response.status).toBe(400)
    })
  })
})
