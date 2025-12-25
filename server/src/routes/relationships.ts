import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  getRelationshipsByEventId,
  createRelationship,
  deleteRelationship,
  getRelationshipById,
} from '../services/relationships.service.js';
import type { CreateRelationshipInput } from 'shared';

const router = Router();

router.get('/events/:eventId/relationships', (req: Request, res: Response) => {
  const relationships = getRelationshipsByEventId(req.params.eventId);
  res.json(relationships);
});

router.post('/', (req: Request, res: Response) => {
  const input: CreateRelationshipInput = req.body;

  if (!input.source_id || !input.target_id || !input.type) {
    res.status(400).json({ error: 'source_id, target_id, and type are required' });
    return;
  }

  try {
    const relationship = createRelationship(input);
    res.status(201).json(relationship);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('Invalid relationship type') || error.message.includes('self')) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message.includes('UNIQUE constraint failed')) {
        res.status(409).json({ error: 'This relationship already exists' });
        return;
      }
    }
    throw error;
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid relationship id' });
    return;
  }

  const relationship = getRelationshipById(id);

  if (!relationship) {
    res.status(404).json({ error: 'Relationship not found' });
    return;
  }

  res.json(relationship);
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid relationship id' });
    return;
  }

  const deleted = deleteRelationship(id);

  if (!deleted) {
    res.status(404).json({ error: 'Relationship not found' });
    return;
  }

  res.status(204).send();
});

export default router;
