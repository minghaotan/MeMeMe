import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { handlePush, handlePull } from '../services/sync.js'
import { updateBlockStatus } from '../db/repositories/data-block.js'
import type { SyncPushRequest, SyncPullRequest, ApiResponse, SyncPushResponse, SyncPullResponse } from '@mememe/shared'

const router = Router()
router.use(authMiddleware)

// POST /api/sync/push
router.post('/push', (req, res, next) => {
  try {
    const body = req.body as SyncPushRequest
    if (!body.deviceId || !Array.isArray(body.blocks)) {
      res.status(400).json({ success: false, error: 'Invalid request' } satisfies ApiResponse)
      return
    }
    const result = handlePush(req.auth!.userId, body)
    res.json({ success: true, data: result } satisfies ApiResponse<SyncPushResponse>)
  } catch (err) {
    next(err)
  }
})

// POST /api/sync/pull
router.post('/pull', (req, res, next) => {
  try {
    const body = req.body as SyncPullRequest
    if (!body.deviceId) {
      res.status(400).json({ success: false, error: 'Missing deviceId' } satisfies ApiResponse)
      return
    }
    const result = handlePull(req.auth!.userId, body)
    res.json({ success: true, data: result } satisfies ApiResponse<SyncPullResponse>)
  } catch (err) {
    next(err)
  }
})

// PUT /api/sync/blocks/:id/status
router.put('/blocks/:id/status', (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['active', 'hidden', 'void'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' } satisfies ApiResponse)
      return
    }
    const ok = updateBlockStatus(id, req.auth!.userId, status)
    if (!ok) {
      res.status(404).json({ success: false, error: 'Block not found' } satisfies ApiResponse)
      return
    }
    res.json({ success: true } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

export default router
