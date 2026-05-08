import { Router } from 'express'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth.js'
import { saveMedia, getUserMedia, getPublicMedia, getMediaFile, copyPublicMedia } from '../services/media.js'
import type { ApiResponse } from '@mememe/shared'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })
const router = Router()

// POST /api/media/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' } satisfies ApiResponse)
      return
    }
    const isPublic = req.body.isPublic === 'true'
    const meta = req.body.metadata ? JSON.parse(req.body.metadata) : {}
    const tags = req.body.tags ? JSON.parse(req.body.tags) : []
    const result = await saveMedia(req.auth!.userId, req.file, isPublic, meta, tags)
    res.json({ success: true, data: result } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

// GET /api/media/my
router.get('/my', authMiddleware, (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const results = getUserMedia(req.auth!.userId, offset, limit)
    res.json({ success: true, data: results } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

// GET /api/media/public — family cloud public content
router.get('/public', authMiddleware, (req, res, next) => {
  try {
    const offset = parseInt(req.query.offset as string) || 0
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)
    const { media, total } = getPublicMedia(offset, limit)
    res.json({ success: true, data: media, total, offset, limit } satisfies ApiResponse & { total: number; offset: number; limit: number })
  } catch (err) {
    next(err)
  }
})

// GET /api/media/:id/file — serve file
router.get('/:id/file', authMiddleware, (req, res, next) => {
  try {
    const { filePath, mimeType } = getMediaFile(req.params.id, req.auth!.userId)
    res.setHeader('Content-Type', mimeType)
    res.sendFile(filePath)
  } catch (err) {
    next(err)
  }
})

// POST /api/media/:id/copy — obtain public copy
router.post('/:id/copy', authMiddleware, (req, res, next) => {
  try {
    copyPublicMedia(req.params.id, req.auth!.userId)
    res.json({ success: true } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

export default router
