import { getDb } from '../index.js'

export interface MediaRow {
  id: string
  user_id: string
  filename: string
  mime_type: string
  size_bytes: number
  file_path: string
  thumbnail_id: string | null
  is_public: 0 | 1
  metadata: string // JSON
  tags: string // JSON
  created_at: number
}

export function createMedia(media: Omit<MediaRow, 'created_at'>): MediaRow {
  const now = Date.now()
  getDb().prepare(`
    INSERT INTO media (id, user_id, filename, mime_type, size_bytes, file_path, thumbnail_id, is_public, metadata, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(media.id, media.user_id, media.filename, media.mime_type, media.size_bytes,
    media.file_path, media.thumbnail_id, media.is_public, media.metadata, media.tags, now)
  return findMediaById(media.id)!
}

export function findMediaById(id: string): MediaRow | undefined {
  return getDb().prepare('SELECT * FROM media WHERE id = ?').get(id) as MediaRow | undefined
}

export function findMediaByUser(userId: string, offset = 0, limit = 50): MediaRow[] {
  return getDb().prepare(
    'SELECT * FROM media WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(userId, limit, offset) as MediaRow[]
}

export function findPublicMedia(offset = 0, limit = 50): MediaRow[] {
  return getDb().prepare(
    'SELECT * FROM media WHERE is_public = 1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset) as MediaRow[]
}

export function countPublicMedia(): number {
  const row = getDb().prepare('SELECT COUNT(*) as count FROM media WHERE is_public = 1').get() as { count: number }
  return row.count
}

export function makeMediaCopy(mediaId: string, userId: string, copyId: string): void {
  const now = Date.now()
  getDb().prepare(
    'INSERT OR IGNORE INTO media_copies (id, media_id, user_id, copied_at) VALUES (?, ?, ?, ?)'
  ).run(copyId, mediaId, userId, now)
}

export function findMediaCopiesByUser(userId: string): string[] {
  const rows = getDb().prepare('SELECT media_id FROM media_copies WHERE user_id = ?').all(userId) as { media_id: string }[]
  return rows.map(r => r.media_id)
}
