import type { SyncPushRequest, SyncPushResponse, SyncPullRequest, SyncPullResponse } from '@mememe/shared'
import * as blockRepo from '../db/repositories/data-block.js'
import * as deviceRepo from '../db/repositories/device.js'
import { getDb } from '../db/index.js'

export function handlePush(userId: string, request: SyncPushRequest): SyncPushResponse {
  const accepted: SyncPushResponse['accepted'] = []
  const rejected: SyncPushResponse['rejected'] = []

  const txn = getDb().transaction(() => {
    for (const block of request.blocks) {
      const existing = blockRepo.findBlockById(block.id, userId)

      if (existing && existing.timestamp >= block.timestamp) {
        rejected.push({ id: block.id, reason: 'conflict_server_newer' })
        continue
      }

      blockRepo.upsertBlock({
        id: block.id,
        userId,
        blockType: block.blockType as Parameters<typeof blockRepo.upsertBlock>[0]['blockType'],
        encryptedContent: block.encryptedContent,
        timestamp: block.timestamp,
        tags: JSON.stringify(block.tags),
        status: block.status as Parameters<typeof blockRepo.upsertBlock>[0]['status'],
        deviceId: request.deviceId,
      })

      accepted.push({ id: block.id, serverTimestamp: Date.now() })
    }

    deviceRepo.updateSyncTime(request.deviceId)

    // Log sync
    getDb().prepare(
      'INSERT INTO sync_log (device_id, direction, block_count) VALUES (?, ?, ?)'
    ).run(request.deviceId, 'push', request.blocks.length)
  })

  txn()
  return { accepted, rejected }
}

export function handlePull(userId: string, request: SyncPullRequest): SyncPullResponse {
  const blocks = blockRepo.findBlocksByUser(userId, request.cursor)

  // Filter out blocks the client already has
  const knownSet = new Set(request.knownBlockIds)
  const newBlocks = blocks.filter(b => !knownSet.has(b.id))

  // Check if there are more blocks
  const allIds = blockRepo.findBlockIdsByUser(userId)
  const remainingAfter = request.cursor
    ? allIds.filter(id => {
        const b = blocks.find(x => x.id === id)
        return b && b.timestamp > request.cursor!
      }).length
    : allIds.length

  const serverBlocks = newBlocks.map(b => ({
    id: b.id,
    blockType: b.block_type,
    encryptedContent: b.encrypted_content,
    timestamp: b.timestamp,
    tags: JSON.parse(b.tags),
    status: b.status,
  }))

  deviceRepo.updateSyncTime(request.deviceId)

  getDb().prepare(
    'INSERT INTO sync_log (device_id, direction, block_count) VALUES (?, ?, ?)'
  ).run(request.deviceId, 'pull', newBlocks.length)

  return {
    blocks: serverBlocks,
    serverTimestamp: Date.now(),
    hasMore: newBlocks.length < remainingAfter,
  }
}
