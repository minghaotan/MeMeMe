import { getDb } from '../index.js'

export interface DeviceRow {
  id: string
  user_id: string
  device_name: string
  device_type: 'ios' | 'android' | 'desktop'
  last_sync_at: number | null
  last_location_lat: number | null
  last_location_lng: number | null
  last_location_at: number | null
  created_at: number
}

export function findDeviceById(id: string): DeviceRow | undefined {
  return getDb().prepare('SELECT * FROM devices WHERE id = ?').get(id) as DeviceRow | undefined
}

export function findDevicesByUser(userId: string): DeviceRow[] {
  return getDb().prepare('SELECT * FROM devices WHERE user_id = ? ORDER BY created_at DESC').all(userId) as DeviceRow[]
}

export function createDevice(device: {
  id: string
  userId: string
  deviceName: string
  deviceType: 'ios' | 'android' | 'desktop'
}): DeviceRow {
  const now = Date.now()
  getDb().prepare(
    'INSERT INTO devices (id, user_id, device_name, device_type, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(device.id, device.userId, device.deviceName, device.deviceType, now)
  return findDeviceById(device.id)!
}

export function updateSyncTime(deviceId: string): void {
  getDb().prepare('UPDATE devices SET last_sync_at = ? WHERE id = ?').run(Date.now(), deviceId)
}

export function updateLocation(deviceId: string, lat: number, lng: number): void {
  const now = Date.now()
  getDb().prepare(
    'UPDATE devices SET last_location_lat = ?, last_location_lng = ?, last_location_at = ? WHERE id = ?'
  ).run(lat, lng, now, deviceId)
}
