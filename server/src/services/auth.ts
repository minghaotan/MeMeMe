import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuid } from 'uuid'
import { config } from '../config.js'
import * as userRepo from '../db/repositories/user.js'
import * as deviceRepo from '../db/repositories/device.js'
import * as loginAttemptRepo from '../db/repositories/login-attempt.js'
import { getDb } from '../db/index.js'
import { AppError } from '../middleware/error-handler.js'
import type { AuthPayload } from '../middleware/auth.js'
import type { LoginRequest, LoginResponse, LockoutState } from '@mememe/shared'
import { LOCKOUT_THRESHOLDS } from '@mememe/shared'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function getLockoutState(username: string): LockoutState {
  const now = Date.now()
  // Check each threshold
  for (const [threshold, lockMs] of LOCKOUT_THRESHOLDS) {
    const since = now - lockMs
    const fails = loginAttemptRepo.countRecentFailedAttempts(username, since)
    if (fails >= threshold) {
      // Find the time of the threshold-th failure
      const attempts = getRecentFailedTimestamps(username, threshold)
      if (attempts.length >= threshold) {
        const lockUntil = attempts[threshold - 1] + lockMs
        if (lockUntil > now) {
          return { attempts: fails, lockedUntil: lockUntil }
        }
      }
    }
  }
  return { attempts: loginAttemptRepo.countRecentFailedAttempts(username, 3600_000), lockedUntil: null }
}

function getRecentFailedTimestamps(username: string, count: number): number[] {
  const rows = getDb().prepare(
    'SELECT attempted_at FROM login_attempts WHERE username = ? AND success = 0 ORDER BY attempted_at DESC LIMIT ?'
  ).all(username, count) as { attempted_at: number }[]
  return rows.map((r: { attempted_at: number }) => r.attempted_at).reverse()
}

export async function login(req: LoginRequest, ipAddress: string): Promise<LoginResponse> {
  // Check lockout
  const lockout = getLockoutState(req.username)
  if (lockout.lockedUntil && lockout.lockedUntil > Date.now()) {
    const remaining = Math.ceil((lockout.lockedUntil - Date.now()) / 1000)
    throw new AppError(429, `Account locked. Try again in ${remaining} seconds`, 'LOCKED')
  }

  const user = userRepo.findUserByUsername(req.username)
  if (!user) {
    loginAttemptRepo.recordLoginAttempt(req.username, false, ipAddress)
    throw new AppError(401, 'Invalid username or password', 'AUTH_FAILED')
  }

  if (user.status === 'disabled') {
    throw new AppError(403, 'Account disabled', 'DISABLED')
  }

  const valid = await verifyPassword(req.password, user.password_hash)
  if (!valid) {
    loginAttemptRepo.recordLoginAttempt(req.username, false, ipAddress)
    throw new AppError(401, 'Invalid username or password', 'AUTH_FAILED')
  }

  // Create or reuse device
  let device = deviceRepo.findDevicesByUser(user.id).find(d => d.device_name === req.deviceName)
  if (!device) {
    device = deviceRepo.createDevice({
      id: uuid(),
      userId: user.id,
      deviceName: req.deviceName,
      deviceType: req.deviceType,
    })
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role, deviceId: device.id } satisfies AuthPayload,
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  loginAttemptRepo.recordLoginAttempt(req.username, true, ipAddress, device.id)

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
      createdAt: user.created_at,
    },
    deviceId: device.id,
    serverTimestamp: Date.now(),
  }
}
