import { getDb } from '../index.js'
import type { UserRole } from '@mememe/shared'

export interface UserRow {
  id: string
  username: string
  password_hash: string
  role: UserRole
  status: 'active' | 'disabled'
  created_at: number
  updated_at: number
}

export function findUserByUsername(username: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined
}

export function findUserById(id: string): UserRow | undefined {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined
}

export function createUser(user: Pick<UserRow, 'id' | 'username' | 'password_hash' | 'role'>): UserRow {
  const now = Date.now()
  getDb().prepare(
    'INSERT INTO users (id, username, password_hash, role, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(user.id, user.username, user.password_hash, user.role, 'active', now, now)
  return findUserById(user.id)!
}

export function listUsers(): UserRow[] {
  return getDb().prepare('SELECT * FROM users ORDER BY created_at DESC').all() as UserRow[]
}

export function updateUserStatus(id: string, status: 'active' | 'disabled'): void {
  getDb().prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), id)
}

export function changePassword(id: string, newHash: string): void {
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(newHash, Date.now(), id)
}
