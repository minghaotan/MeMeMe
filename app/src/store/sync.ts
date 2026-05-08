import { create } from 'zustand'
import type { SyncStatus } from '@mememe/shared'
import { configureSync, fullSync } from '../lib/sync'
import type { SyncHostConfig } from '../lib/context'

interface SyncState {
  status: SyncStatus
  isOnline: boolean
  serverUrl: string | null
  configure: (cfg: SyncHostConfig) => void
  checkAndSync: () => Promise<void>
  setOnline: (online: boolean) => void
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: {
    lastSyncAt: null,
    pendingPushCount: 0,
    pendingPullCount: 0,
    isOnline: false,
    serverUrl: null,
  },
  isOnline: false,
  serverUrl: null,

  configure: (cfg) => {
    configureSync(cfg)
    set({ serverUrl: cfg.serverUrl, isOnline: true })
  },

  checkAndSync: async () => {
    const { isOnline } = get()
    if (!isOnline) return

    try {
      const { pushed, pulled } = await fullSync()
      set(state => ({
        status: {
          ...state.status,
          lastSyncAt: Date.now(),
          pendingPushCount: 0,
          pendingPullCount: 0,
          isOnline: true,
        },
      }))
    } catch {
      set(state => ({ isOnline: false, status: { ...state.status, isOnline: false } }))
    }
  },

  setOnline: (online) => set(state => ({
    isOnline: online,
    status: { ...state.status, isOnline: online },
  })),
}))
