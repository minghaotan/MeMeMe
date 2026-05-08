import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { hashPassword } from '../services/auth.js'
import { AppError } from '../middleware/error-handler.js'
import * as userRepo from '../db/repositories/user.js'
import * as deviceRepo from '../db/repositories/device.js'
import type { ApiResponse, ServerUser } from '@mememe/shared'

const router = Router()
router.use(authMiddleware)
router.use(adminMiddleware)

// GET /api/admin/users
router.get('/users', (_req, res, next) => {
  try {
    const users = userRepo.listUsers().map(u => ({
      id: u.id,
      username: u.username,
      role: u.role,
      status: u.status,
      createdAt: u.created_at,
    } satisfies ServerUser))
    res.json({ success: true, data: users } satisfies ApiResponse<ServerUser[]>)
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/users — create user
router.post('/users', async (req, res, next) => {
  try {
    const { username, password, role } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Missing username or password' } satisfies ApiResponse)
      return
    }
    if (password.length < 8) {
      res.status(400).json({ success: false, error: 'Password too short (min 8)' } satisfies ApiResponse)
      return
    }
    if (userRepo.findUserByUsername(username)) {
      res.status(409).json({ success: false, error: 'Username already exists' } satisfies ApiResponse)
      return
    }

    const hash = await hashPassword(password)
    const user = userRepo.createUser({
      id: uuid(),
      username,
      password_hash: hash,
      role: role === 'admin' ? 'admin' : 'user',
    })

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      } satisfies ServerUser,
    } satisfies ApiResponse<ServerUser>)
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'disabled'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' } satisfies ApiResponse)
      return
    }
    const user = userRepo.findUserById(req.params.id)
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' } satisfies ApiResponse)
      return
    }
    userRepo.updateUserStatus(req.params.id, status)
    res.json({ success: true } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/devices — all devices
router.get('/devices', (_req, res, next) => {
  try {
    const users = userRepo.listUsers()
    const allDevices = users.flatMap(u => {
      const devices = deviceRepo.findDevicesByUser(u.id)
      return devices.map(d => ({
        id: d.id,
        userId: u.id,
        username: u.username,
        deviceName: d.device_name,
        deviceType: d.device_type,
        lastSyncAt: d.last_sync_at,
        lastLocationLat: d.last_location_lat,
        lastLocationLng: d.last_location_lng,
        createdAt: d.created_at,
      }))
    })
    res.json({ success: true, data: allDevices } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

export default router
