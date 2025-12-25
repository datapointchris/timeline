import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Relationships API', () => {
  beforeEach(async () => {
    await request(app).post('/api/events').send({ id: 'event-a', title: 'Event A' });
    await request(app).post('/api/events').send({ id: 'event-b', title: 'Event B' });
  });

  describe('POST /api/relationships', () => {
    it('should create a relationship between events', async () => {
      const response = await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'influenced_by',
        notes: 'A was influenced by B',
      });

      expect(response.status).toBe(201);
      expect(response.body.source_id).toBe('event-a');
      expect(response.body.target_id).toBe('event-b');
      expect(response.body.type).toBe('influenced_by');
    });

    it('should return 400 for invalid relationship type', async () => {
      const response = await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'invalid_type',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid relationship type');
    });

    it('should return 404 if source event does not exist', async () => {
      const response = await request(app).post('/api/relationships').send({
        source_id: 'non-existent',
        target_id: 'event-b',
        type: 'related',
      });

      expect(response.status).toBe(404);
    });

    it('should return 400 for self-referential relationship', async () => {
      const response = await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-a',
        type: 'related',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('self');
    });

    it('should return 409 for duplicate relationship', async () => {
      await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'related',
      });

      const response = await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'related',
      });

      expect(response.status).toBe(409);
    });
  });

  describe('GET /api/events/:id with relationships', () => {
    it('should return outgoing relationships', async () => {
      await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'influenced_by',
      });

      const response = await request(app).get('/api/events/event-a');

      expect(response.body.relationships).toHaveLength(1);
      expect(response.body.relationships[0].type).toBe('influenced_by');
      expect(response.body.relationships[0].event.id).toBe('event-b');
    });

    it('should return inverse relationships with computed type', async () => {
      await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'influenced_by',
      });

      const response = await request(app).get('/api/events/event-b');

      expect(response.body.inverse_relationships).toHaveLength(1);
      expect(response.body.inverse_relationships[0].type).toBe('influenced');
      expect(response.body.inverse_relationships[0].event.id).toBe('event-a');
    });
  });

  describe('DELETE /api/relationships/:id', () => {
    it('should delete a relationship', async () => {
      const createResponse = await request(app).post('/api/relationships').send({
        source_id: 'event-a',
        target_id: 'event-b',
        type: 'related',
      });

      const relationshipId = createResponse.body.id;

      const deleteResponse = await request(app).delete(`/api/relationships/${relationshipId}`);
      expect(deleteResponse.status).toBe(204);

      const getResponse = await request(app).get('/api/events/event-a');
      expect(getResponse.body.relationships).toHaveLength(0);
    });

    it('should return 404 for non-existent relationship', async () => {
      const response = await request(app).delete('/api/relationships/999');
      expect(response.status).toBe(404);
    });
  });
});
