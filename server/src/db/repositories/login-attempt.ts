import { getDb } from '../index.js'

export function recordLoginAttempt(username: string, success: boolean, ipAddress: string, deviceId?: string): void {
  getDb().prepare(
    'INSERT INTO login_attempts (username, device_id, success, ip_address, attempted_at) VALUES (?, ?, ?, ?, ?)'
  ).run(username, deviceId || null, success ? 1 : 0, ipAddress, Date.now())
}

export function countRecentFailedAttempts(username: string, sinceMs: number): number {
  const row = getDb().prepare(
    'SELECT COUNT(*) as count FROM login_attempts WHERE username = ? AND success = 0 AND attempted_at > ?'
  ).get(username, sinceMs) as { count: number }
  return row.count
}
