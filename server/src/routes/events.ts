import type { Request, Response } from 'express';
import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
} from '../services/events.service.js';
import type { CreateEventInput, UpdateEventInput } from 'shared';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const filters = {
    tag: req.query.tag as string | undefined,
    type: req.query.type as string | undefined,
    after: req.query.after as string | undefined,
    before: req.query.before as string | undefined,
  };

  const events = getAllEvents(filters);
  res.json(events);
});

router.get('/search', (req: Request, res: Response) => {
  const query = req.query.q as string;

  if (!query) {
    res.status(400).json({ error: 'Query parameter "q" is required' });
    return;
  }

  const events = searchEvents(query);
  res.json(events);
});

router.get('/:id', (req: Request, res: Response) => {
  const event = getEventById(req.params.id);

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json(event);
});

router.post('/', (req: Request, res: Response) => {
  const input: CreateEventInput = req.body;

  if (!input.id || !input.title) {
    res.status(400).json({ error: 'id and title are required' });
    return;
  }

  try {
    const event = createEvent(input);
    res.status(201).json(event);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ error: 'Event with this id already exists' });
      return;
    }
    throw error;
  }
});

router.put('/:id', (req: Request, res: Response) => {
  const input: UpdateEventInput = req.body;
  const event = updateEvent(req.params.id, input);

  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.json(event);
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = deleteEvent(req.params.id);

  if (!deleted) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }

  res.status(204).send();
});

export default router;
