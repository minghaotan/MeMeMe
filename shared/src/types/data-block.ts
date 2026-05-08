// ---- Data Block Types ----
// A DataBlock is the atomic unit of sync. Each block has a unique ID,
// a type, encrypted content, and a timestamp for conflict resolution.

export type BlockType = 'password' | 'document' | 'photo' | 'note' | 'other'

export type BlockStatus = 'active' | 'hidden' | 'void'

export interface DataBlock {
  id: string // UUID v4
  blockType: BlockType
  encryptedContent: string // AES-256-GCM encrypted, base64 encoded
  timestamp: number // Unix ms, used for sync conflict resolution
  tags: string[]
  status: BlockStatus
  deviceId: string // which device created this block
}

export interface DataBlockSyncMeta {
  id: string
  timestamp: number
  status: BlockStatus
}

export interface LocalDataBlock extends DataBlock {
  syncedAt: number | null // last time this block was synced to server
  isDirty: boolean // true if local has changes not yet synced
}
