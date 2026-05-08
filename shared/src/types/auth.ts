// ---- Auth Types ----

export type UserRole = 'admin' | 'user'

export interface ServerUser {
  id: string
  username: string
  role: UserRole
  status: 'active' | 'disabled'
  createdAt: number
}

export interface LoginRequest {
  username: string
  password: string
  deviceName: string
  deviceType: 'ios' | 'android' | 'desktop'
}

export interface LoginResponse {
  token: string
  user: ServerUser
  deviceId: string
  serverTimestamp: number
}

export interface DeviceInfo {
  id: string
  deviceName: string
  deviceType: string
  lastSyncAt: number | null
  lastLocationLat: number | null
  lastLocationLng: number | null
  createdAt: number
}

// ---- Client-side Password ----

export interface ClientPasswordPolicy {
  minLength: 8
  requireUpper: boolean
  requireLower: boolean
  requireDigit: boolean
  requireSpecial: boolean
}

export interface LockoutState {
  attempts: number
  lockedUntil: number | null
}

// Escalating lockout: 3→30s, 5→5min, 10→1h
export const LOCKOUT_THRESHOLDS: [number, number][] = [
  [3, 30_000],       // 3 fails → 30 seconds
  [5, 300_000],      // 5 fails → 5 minutes
  [10, 3_600_000],   // 10 fails → 1 hour
]
