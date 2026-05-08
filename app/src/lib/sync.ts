// Sync engine: handles push/pull of encrypted data blocks with the server.

import type { SyncPushRequest, SyncPullRequest, SyncPushResponse, SyncPullResponse } from '@mememe/shared'
import { getDirtyBlocks, markSynced, getLastSyncTimestamp, setLastSyncTimestamp, upsertBlock, getLocalBlocks } from './db'

interface SyncConfig {
  serverUrl: string
  token: string
  deviceId: string
}

let config: SyncConfig | null = null

export function configureSync(cfg: SyncConfig): void {
  config = cfg
}

function authHeaders(): Record<string, string> {
  if (!config) throw new Error('Sync not configured')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.token}`,
  }
}

export async function pushChanges(): Promise<SyncPushResponse> {
  if (!config) throw new Error('Sync not configured')

  const dirtyBlocks = await getDirtyBlocks()
  if (dirtyBlocks.length === 0) {
    return { accepted: [], rejected: [] }
  }

  const body: SyncPushRequest = {
    deviceId: config.deviceId,
    blocks: dirtyBlocks.map(b => ({
      id: b.id,
      blockType: b.blockType,
      encryptedContent: b.encryptedContent,
      timestamp: b.timestamp,
      tags: b.tags,
      status: b.status,
    })),
  }

  const res = await fetch(`${config.serverUrl}/api/sync/push`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Push failed: ${res.status}`)

  const json = await res.json()
  const result = json.data as SyncPushResponse

  // Mark accepted blocks as synced
  const acceptedIds = result.accepted.map(a => a.id)
  const now = Date.now()
  await markSynced(acceptedIds, now)
  await setLastSyncTimestamp(now)

  return result
}

export async function pullChanges(): Promise<SyncPullResponse> {
  if (!config) throw new Error('Sync not configured')

  const localBlocks = await getLocalBlocks()
  const lastSync = await getLastSyncTimestamp()

  const body: SyncPullRequest = {
    deviceId: config.deviceId,
    cursor: lastSync,
    knownBlockIds: localBlocks.map(b => b.id),
  }

  const res = await fetch(`${config.serverUrl}/api/sync/pull`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`Pull failed: ${res.status}`)

  const json = await res.json()
  const result = json.data as SyncPullResponse

  // Import new blocks
  for (const block of result.blocks) {
    await upsertBlock({
      id: block.id,
      blockType: block.blockType as any,
      encryptedContent: block.encryptedContent,
      timestamp: block.timestamp,
      tags: block.tags,
      status: block.status as any,
      deviceId: config.deviceId,
    })
  }

  await setLastSyncTimestamp(result.serverTimestamp)
  return result
}

export async function fullSync(): Promise<{ pushed: number; pulled: number }> {
  const pushResult = await pushChanges()
  const pullResult = await pullChanges()

  return {
    pushed: pushResult.accepted.length,
    pulled: pullResult.blocks.length,
  }
}
