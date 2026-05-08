import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import * as deviceRepo from '../db/repositories/device.js'
import type { ApiResponse, DeviceInfo } from '@mememe/shared'

const router = Router()
router.use(authMiddleware)

// GET /api/device/list
router.get('/list', (req, res, next) => {
  try {
    const devices = deviceRepo.findDevicesByUser(req.auth!.userId)
    const result: DeviceInfo[] = devices.map(d => ({
      id: d.id,
      deviceName: d.device_name,
      deviceType: d.device_type,
      lastSyncAt: d.last_sync_at,
      lastLocationLat: d.last_location_lat,
      lastLocationLng: d.last_location_lng,
      createdAt: d.created_at,
    }))
    res.json({ success: true, data: result } satisfies ApiResponse<DeviceInfo[]>)
  } catch (err) {
    next(err)
  }
})

// POST /api/device/location — report location
router.post('/location', (req, res, next) => {
  try {
    const { lat, lng } = req.body
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ success: false, error: 'Invalid coordinates' } satisfies ApiResponse)
      return
    }
    deviceRepo.updateLocation(req.auth!.deviceId, lat, lng)
    res.json({ success: true } satisfies ApiResponse)
  } catch (err) {
    next(err)
  }
})

export default router
