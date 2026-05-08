// Local SQLite database via Tauri SQL plugin.
// Stores encrypted data blocks, settings, and sync metadata.

import type { LocalDataBlock, DataBlockSyncMeta } from '@mememe/shared'

// In Tauri context, use the SQL plugin. For web dev, we use a stub.
// The actual Tauri DB is initialized from src-tauri/src/lib.rs

let db: any = null

async function getTauriDb() {
  if (db) return db
  try {
    const { default: Database } = await import('@tauri-apps/plugin-sql')
    db = await Database.load('sqlite:meme.db')
    await initLocalSchema()
  } catch {
    // Fallback for web dev: use localStorage
    console.warn('[db] Tauri SQL plugin not available, using localStorage fallback')
    db = createLocalStorageFallback()
  }
  return db
}

async function initLocalSchema() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS local_blocks (
      id TEXT PRIMARY KEY,
      block_type TEXT NOT NULL,
      encrypted_content TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      device_id TEXT NOT NULL,
      synced_at INTEGER,
      is_dirty INTEGER NOT NULL DEFAULT 1
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS local_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_meta (
      last_sync_at INTEGER,
      server_url TEXT
    )
  `)
}

function createLocalStorageFallback() {
  const store = new Map<string, any>()
  return {
    select: async (sql: string, params?: any[]) => {
      console.log('[db:stub] select', sql.slice(0, 60))
      return []
    },
    execute: async (sql: string, params?: any[]) => {
      console.log('[db:stub] execute', sql.slice(0, 60))
    },
  }
}

// ---- Block CRUD ----

export async function getLocalBlocks(): Promise<LocalDataBlock[]> {
  const db = await getTauriDb()
  const rows = await db.select('SELECT * FROM local_blocks ORDER BY timestamp DESC')
  return rows.map(parseBlock)
}

export async function getBlockById(id: string): Promise<LocalDataBlock | null> {
  const db = await getTauriDb()
  const rows = await db.select('SELECT * FROM local_blocks WHERE id = ?', [id])
  return rows.length > 0 ? parseBlock(rows[0]) : null
}

export async function upsertBlock(block: Omit<LocalDataBlock, 'syncedAt' | 'isDirty'>): Promise<void> {
  const db = await getTauriDb()
  const existing = await db.select('SELECT id FROM local_blocks WHERE id = ?', [block.id])
  if (existing.length > 0) {
    await db.execute(
      `UPDATE local_blocks SET encrypted_content = ?, timestamp = ?, tags = ?, status = ?, is_dirty = 1
       WHERE id = ?`,
      [block.encryptedContent, block.timestamp, JSON.stringify(block.tags), block.status, block.id]
    )
  } else {
    await db.execute(
      `INSERT INTO local_blocks (id, block_type, encrypted_content, timestamp, tags, status, device_id, is_dirty)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [block.id, block.blockType, block.encryptedContent, block.timestamp,
       JSON.stringify(block.tags), block.status, block.deviceId]
    )
  }
}

export async function updateBlockStatus(id: string, status: string): Promise<void> {
  const db = await getTauriDb()
  await db.execute('UPDATE local_blocks SET status = ?, is_dirty = 1 WHERE id = ?', [status, id])
}

export async function markSynced(ids: string[], syncedAt: number): Promise<void> {
  const db = await getTauriDb()
  for (const id of ids) {
    await db.execute('UPDATE local_blocks SET synced_at = ?, is_dirty = 0 WHERE id = ?', [syncedAt, id])
  }
}

export async function getDirtyBlocks(): Promise<LocalDataBlock[]> {
  const db = await getTauriDb()
  const rows = await db.select('SELECT * FROM local_blocks WHERE is_dirty = 1')
  return rows.map(parseBlock)
}

// ---- Settings ----

export async function getSetting(key: string): Promise<string | null> {
  const db = await getTauriDb()
  const rows = await db.select('SELECT value FROM local_settings WHERE key = ?', [key])
  return rows.length > 0 ? rows[0].value : null
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getTauriDb()
  await db.execute(
    'INSERT OR REPLACE INTO local_settings (key, value) VALUES (?, ?)',
    [key, value]
  )
}

// ---- Sync Meta ----

export async function getLastSyncTimestamp(): Promise<number | null> {
  const db = await getTauriDb()
  const rows = await db.select('SELECT last_sync_at FROM sync_meta LIMIT 1')
  return rows.length > 0 ? rows[0].last_sync_at : null
}

export async function setLastSyncTimestamp(ts: number): Promise<void> {
  const db = await getTauriDb()
  await db.execute('DELETE FROM sync_meta')
  await db.execute('INSERT INTO sync_meta (last_sync_at) VALUES (?)', [ts])
}

// ---- Helpers ----

function parseBlock(row: any): LocalDataBlock {
  return {
    id: row.id,
    blockType: row.block_type,
    encryptedContent: row.encrypted_content,
    timestamp: row.timestamp,
    tags: JSON.parse(row.tags || '[]'),
    status: row.status,
    deviceId: row.device_id,
    syncedAt: row.synced_at,
    isDirty: row.is_dirty === 1,
  }
}
