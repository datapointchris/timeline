import type { Request, Response } from 'express'
import { Router } from 'express'
import {
  getRelationshipsByEventId,
  createRelationship,
  deleteRelationship,
  getRelationshipById,
} from '../services/relationships.service.js'
import { InvalidRelationshipTypeError, isDuplicateKey, NotFoundError, SelfRelationshipError, sendError } from '../errors.js'
import type { CreateRelationshipInput } from 'shared'

const router = Router()

router.get('/events/:eventId/relationships', (req: Request, res: Response) => {
  const relationships = getRelationshipsByEventId(req.params.eventId)
  res.json(relationships)
})

router.post('/', (req: Request, res: Response) => {
  const input: CreateRelationshipInput = req.body

  if (!input.source_id || !input.target_id || !input.type) {
    sendError(res, 400, 'source_id, target_id, and type are required')
    return
  }

  try {
    const relationship = createRelationship(input)
    res.status(201).json(relationship)
  } catch (error) {
    if (error instanceof NotFoundError) {
      sendError(res, 404, error.message, error.code)
      return
    }
    if (error instanceof InvalidRelationshipTypeError || error instanceof SelfRelationshipError) {
      sendError(res, 400, error.message, error.code)
      return
    }
    if (isDuplicateKey(error)) {
      sendError(res, 409, 'This relationship already exists', 'duplicate')
      return
    }
    throw error
  }
})

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)

  if (isNaN(id)) {
    sendError(res, 400, 'Invalid relationship id')
    return
  }

  const relationship = getRelationshipById(id)

  if (!relationship) {
    sendError(res, 404, 'Relationship not found')
    return
  }

  res.json(relationship)
})

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)

  if (isNaN(id)) {
    sendError(res, 400, 'Invalid relationship id')
    return
  }

  const deleted = deleteRelationship(id)

  if (!deleted) {
    sendError(res, 404, 'Relationship not found')
    return
  }

  res.status(204).send()
})

export default router
