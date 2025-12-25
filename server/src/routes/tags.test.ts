import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

const app = createApp();

describe('Tags API', () => {
  describe('GET /api/tags', () => {
    it('should return empty array when no tags', async () => {
      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all tags alphabetically', async () => {
      await request(app)
        .post('/api/events')
        .send({ id: 'e1', title: 'E1', tags: ['zebra', 'apple', 'banana'] });

      const response = await request(app).get('/api/tags');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body[0].name).toBe('apple');
      expect(response.body[1].name).toBe('banana');
      expect(response.body[2].name).toBe('zebra');
    });
  });

  describe('POST /api/tags/events/:eventId/tags', () => {
    beforeEach(async () => {
      await request(app).post('/api/events').send({ id: 'test-event', title: 'Test' });
    });

    it('should add a tag to an event', async () => {
      const response = await request(app)
        .post('/api/tags/events/test-event/tags')
        .send({ name: 'philosophy' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('philosophy');

      const eventResponse = await request(app).get('/api/events/test-event');
      expect(eventResponse.body.tags).toHaveLength(1);
      expect(eventResponse.body.tags[0].name).toBe('philosophy');
    });

    it('should reuse existing tag', async () => {
      await request(app).post('/api/tags/events/test-event/tags').send({ name: 'shared-tag' });

      await request(app).post('/api/events').send({ id: 'second-event', title: 'Second' });
      await request(app).post('/api/tags/events/second-event/tags').send({ name: 'shared-tag' });

      const tagsResponse = await request(app).get('/api/tags');
      const sharedTags = tagsResponse.body.filter((t: { name: string }) => t.name === 'shared-tag');
      expect(sharedTags).toHaveLength(1);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .post('/api/tags/events/non-existent/tags')
        .send({ name: 'tag' });

      expect(response.status).toBe(404);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app).post('/api/tags/events/test-event/tags').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tags/events/:eventId/tags/:tagId', () => {
    it('should remove a tag from an event', async () => {
      await request(app)
        .post('/api/events')
        .send({ id: 'tagged-event', title: 'Tagged', tags: ['removable'] });

      const tagsResponse = await request(app).get('/api/tags');
      const tagId = tagsResponse.body.find((t: { name: string }) => t.name === 'removable').id;

      const deleteResponse = await request(app).delete(
        `/api/tags/events/tagged-event/tags/${tagId}`
      );
      expect(deleteResponse.status).toBe(204);

      const eventResponse = await request(app).get('/api/events/tagged-event');
      expect(eventResponse.body.tags).toHaveLength(0);
    });

    it('should return 404 for non-existent tag on event', async () => {
      await request(app).post('/api/events').send({ id: 'no-tags', title: 'No Tags' });

      const response = await request(app).delete('/api/tags/events/no-tags/tags/999');
      expect(response.status).toBe(404);
    });
  });
});
