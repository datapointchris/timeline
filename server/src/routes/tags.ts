import type { Request, Response } from 'express'
import { Router } from 'express'
import { getAllTags, getTagsForEvent, addTagToEvent, removeTagFromEvent } from '../services/tags.service.js'
import { NotFoundError, sendError } from '../errors.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const tags = getAllTags()
  res.json(tags)
})

router.get('/events/:eventId/tags', (req: Request, res: Response) => {
  const tags = getTagsForEvent(req.params.eventId)
  res.json(tags)
})

router.post('/events/:eventId/tags', (req: Request, res: Response) => {
  const { name } = req.body

  if (!name || typeof name !== 'string') {
    sendError(res, 400, 'Tag name is required')
    return
  }

  try {
    const tag = addTagToEvent(req.params.eventId, name.trim())
    res.status(201).json(tag)
  } catch (error) {
    if (error instanceof NotFoundError) {
      sendError(res, 404, error.message, error.code)
      return
    }
    throw error
  }
})

router.delete('/events/:eventId/tags/:tagId', (req: Request, res: Response) => {
  const tagId = parseInt(req.params.tagId, 10)

  if (isNaN(tagId)) {
    sendError(res, 400, 'Invalid tag id')
    return
  }

  const removed = removeTagFromEvent(req.params.eventId, tagId)

  if (!removed) {
    sendError(res, 404, 'Tag not found on this event')
    return
  }

  res.status(204).send()
})

export default router
