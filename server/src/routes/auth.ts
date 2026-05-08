import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { login } from '../services/auth.js'
import type { LoginRequest, ApiResponse, LoginResponse } from '@mememe/shared'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const body = req.body as LoginRequest
    if (!body.username || !body.password || !body.deviceName || !body.deviceType) {
      res.status(400).json({ success: false, error: 'Missing required fields' } satisfies ApiResponse)
      return
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    const result = await login(body, ip)
    res.json({ success: true, data: result } satisfies ApiResponse<LoginResponse>)
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.auth!.userId,
      username: req.auth!.username,
      role: req.auth!.role,
      deviceId: req.auth!.deviceId,
    },
  } satisfies ApiResponse)
})

export default router
