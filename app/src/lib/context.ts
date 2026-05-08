// Shared context for the app after unlock: holds the derived encryption key
// and sync configuration so all pages can decrypt/encrypt and sync.

import { createContext, useContext } from 'react'
import type CryptoJS from 'crypto-js'

export interface AppContextType {
  encryptionKey: CryptoJS.lib.WordArray
  syncConfig: SyncHostConfig | null
  setSyncConfig: (cfg: SyncHostConfig) => void
}

export interface SyncHostConfig {
  serverUrl: string
  token: string
  deviceId: string
}

export const AppContext = createContext<AppContextType | null>(null)

export function useAppContext(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('AppContext not found — must be inside unlocked app')
  return ctx
}
