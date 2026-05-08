import { create } from 'zustand'
import type { LocalDataBlock, BlockType, BlockStatus } from '@mememe/shared'
import { getLocalBlocks, upsertBlock, updateBlockStatus } from '@/lib/db'
import { encrypt, decrypt } from '@/lib/crypto'
import { useAuthStore } from './auth'
import { v4 as uuid } from 'uuid'  // Note: we bundle uuid or use crypto.randomUUID()

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

interface VaultItem {
  id: string
  type: BlockType
  title: string // decrypted for display
  tags: string[]
  timestamp: number
  status: BlockStatus
  data: Record<string, string> // decrypted key-value pairs
}

interface VaultState {
  items: VaultItem[]
  isLoading: boolean
  selectedType: BlockType | 'all'

  loadVault: (encryptionKey: string) => Promise<void>
  addItem: (type: BlockType, data: Record<string, string>, tags: string[], encryptionKey: string) => Promise<void>
  removeItem: (id: string) => Promise<void>
  setType: (type: BlockType | 'all') => void
  getFilteredItems: () => VaultItem[]
}

export const useVaultStore = create<VaultState>((set, get) => ({
  items: [],
  isLoading: false,
  selectedType: 'all',

  loadVault: async (encryptionKey) => {
    set({ isLoading: true })
    try {
      const blocks = await getLocalBlocks()
      const key = useAuthStore.getState().encryptionSalt
      // We need the actual CryptoJS key — for now assume it's passed
      // The store caller manages key derivation
      const items: VaultItem[] = []
      for (const block of blocks) {
        try {
          const decrypted = decrypt(block.encryptedContent, (encryptionKey as any))
          const parsed = JSON.parse(decrypted)
          items.push({
            id: block.id,
            type: block.blockType,
            title: parsed.title || 'Untitled',
            tags: block.tags,
            timestamp: block.timestamp,
            status: block.status,
            data: parsed,
          })
        } catch {
          // Skip blocks that can't be decrypted (corrupted or wrong key)
        }
      }
      set({ items, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  addItem: async (type, data, tags, encryptionKey) => {
    const id = generateId()
    const timestamp = Date.now()
    const plaintext = JSON.stringify({ ...data, title: data.title || '' })
    const encryptedContent = encrypt(plaintext, encryptionKey as any)

    const block: Omit<LocalDataBlock, 'syncedAt' | 'isDirty'> = {
      id,
      blockType: type,
      encryptedContent,
      timestamp,
      tags,
      status: 'active',
      deviceId: 'local', // set from auth context in real code
    }

    await upsertBlock(block)

    const item: VaultItem = {
      id,
      type,
      title: data.title || 'Untitled',
      tags,
      timestamp,
      status: 'active',
      data,
    }

    set(state => ({ items: [item, ...state.items] }))
  },

  removeItem: async (id) => {
    await updateBlockStatus(id, 'void')
    set(state => ({
      items: state.items.map(i => i.id === id ? { ...i, status: 'void' as BlockStatus } : i),
    }))
  },

  setType: (type) => set({ selectedType: type }),

  getFilteredItems: () => {
    const { items, selectedType } = get()
    return items
      .filter(i => i.status !== 'void')
      .filter(i => selectedType === 'all' || i.type === selectedType)
  },
}))
