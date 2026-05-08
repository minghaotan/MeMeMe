import { getDb } from '../index.js'
import type { BlockStatus, BlockType } from '@mememe/shared'

export interface DataBlockRow {
  id: string
  user_id: string
  block_type: BlockType
  encrypted_content: string
  timestamp: number
  tags: string // JSON array
  status: BlockStatus
  device_id: string
  created_at: number
  updated_at: number
}

export function findBlockById(id: string, userId: string): DataBlockRow | undefined {
  return getDb().prepare('SELECT * FROM data_blocks WHERE id = ? AND user_id = ?').get(id, userId) as DataBlockRow | undefined
}

export function findBlocksByUser(userId: string, cursor: number | null, limit = 100): DataBlockRow[] {
  if (cursor === null) {
    return getDb().prepare(
      'SELECT * FROM data_blocks WHERE user_id = ? ORDER BY timestamp ASC LIMIT ?'
    ).all(userId, limit) as DataBlockRow[]
  }
  return getDb().prepare(
    'SELECT * FROM data_blocks WHERE user_id = ? AND timestamp > ? ORDER BY timestamp ASC LIMIT ?'
  ).all(userId, cursor, limit) as DataBlockRow[]
}

export function findBlockIdsByUser(userId: string): string[] {
  const rows = getDb().prepare('SELECT id FROM data_blocks WHERE user_id = ?').all(userId) as { id: string }[]
  return rows.map(r => r.id)
}

export function upsertBlock(block: {
  id: string
  userId: string
  blockType: BlockType
  encryptedContent: string
  timestamp: number
  tags: string
  status: BlockStatus
  deviceId: string
}): DataBlockRow {
  const existing = getDb().prepare(
    'SELECT id, timestamp FROM data_blocks WHERE id = ? AND user_id = ?'
  ).get(block.id, block.userId) as { id: string; timestamp: number } | undefined

  if (existing) {
    if (block.timestamp > existing.timestamp) {
      getDb().prepare(`
        UPDATE data_blocks SET encrypted_content = ?, timestamp = ?, tags = ?, status = ?, device_id = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
      `).run(block.encryptedContent, block.timestamp, block.tags, block.status, block.deviceId, Date.now(), block.id, block.userId)
    }
    return findBlockById(block.id, block.userId)!
  }

  const now = Date.now()
  getDb().prepare(`
    INSERT INTO data_blocks (id, user_id, block_type, encrypted_content, timestamp, tags, status, device_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(block.id, block.userId, block.blockType, block.encryptedContent, block.timestamp, block.tags, block.status, block.deviceId, now, now)
  return findBlockById(block.id, block.userId)!
}

export function updateBlockStatus(id: string, userId: string, status: BlockStatus): boolean {
  const result = getDb().prepare(
    'UPDATE data_blocks SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).run(status, Date.now(), id, userId)
  return result.changes > 0
}
