// ---- Sync Protocol Types ----

export interface SyncPushRequest {
  deviceId: string
  blocks: SyncBlockPayload[]
}

export interface SyncBlockPayload {
  id: string
  blockType: string
  encryptedContent: string
  timestamp: number
  tags: string[]
  status: string
}

export interface SyncPushResponse {
  accepted: SyncResult[]
  rejected: SyncRejection[]
}

export interface SyncResult {
  id: string
  serverTimestamp: number
}

export interface SyncRejection {
  id: string
  reason: 'conflict_server_newer' | 'invalid_signature'
}

export interface SyncPullRequest {
  deviceId: string
  cursor: number | null // last sync timestamp, null for initial full pull
  knownBlockIds: string[] // blocks the client already has
}

export interface SyncPullResponse {
  blocks: SyncBlockPayload[]
  serverTimestamp: number
  hasMore: boolean
}

export interface SyncStatus {
  lastSyncAt: number | null
  pendingPushCount: number
  pendingPullCount: number
  isOnline: boolean
  serverUrl: string | null
}
