import { create } from 'zustand'
import type { LockoutState, ClientPasswordPolicy } from '@mememe/shared'
import { setSetting, getSetting } from '@/lib/db'
import { deriveKey, verifyPassword } from '@/lib/crypto'

export const PASSWORD_POLICY: ClientPasswordPolicy = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: false,
}

interface AuthState {
  // State
  isLocked: boolean
  isInitialized: boolean // has the user set up a master password?
  lockout: LockoutState
  encryptionSalt: string | null
  // Actions
  initialize: (password: string) => Promise<boolean>
  unlock: (password: string) => Promise<boolean>
  lock: () => void
  validatePasswordStrength: (password: string) => string | null
  checkLockout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLocked: true,
  isInitialized: false,
  lockout: { attempts: 0, lockedUntil: null },
  encryptionSalt: null,

  initialize: async (password: string) => {
    const error = get().validatePasswordStrength(password)
    if (error) throw new Error(error)

    const { key, salt } = deriveKey(password)
    await setSetting('encryption_salt', salt)
    await setSetting('initialized', 'true')

    set({ isInitialized: true, isLocked: false, encryptionSalt: salt, lockout: { attempts: 0, lockedUntil: null } })
    return true
  },

  unlock: async (password: string) => {
    const state = get()

    // Check lockout
    if (state.lockout.lockedUntil && state.lockout.lockedUntil > Date.now()) {
      const remaining = Math.ceil((state.lockout.lockedUntil - Date.now()) / 1000)
      throw new Error(`已锁定，请在 ${remaining} 秒后重试`)
    }

    const salt = await getSetting('encryption_salt')
    if (!salt) throw new Error('未初始化')

    if (!verifyPassword(password, salt)) {
      const newAttempts = state.lockout.attempts + 1
      // Escalating lockout: 3→30s, 5→5min, 10→1h
      let lockedUntil: number | null = null
      if (newAttempts >= 10) lockedUntil = Date.now() + 3_600_000
      else if (newAttempts >= 5) lockedUntil = Date.now() + 300_000
      else if (newAttempts >= 3) lockedUntil = Date.now() + 30_000

      set({ lockout: { attempts: newAttempts, lockedUntil } })
      throw new Error(lockedUntil ? `密码错误，已锁定 ${Math.ceil((lockedUntil - Date.now()) / 1000)} 秒` : '密码错误')
    }

    set({ isLocked: false, lockout: { attempts: 0, lockedUntil: null } })
    return true
  },

  lock: () => {
    set({ isLocked: true })
  },

  validatePasswordStrength: (password: string): string | null => {
    if (password.length < PASSWORD_POLICY.minLength) return `密码至少 ${PASSWORD_POLICY.minLength} 位`
    if (PASSWORD_POLICY.requireUpper && !/[A-Z]/.test(password)) return '需要包含大写字母'
    if (PASSWORD_POLICY.requireLower && !/[a-z]/.test(password)) return '需要包含小写字母'
    if (PASSWORD_POLICY.requireDigit && !/[0-9]/.test(password)) return '需要包含数字'
    return null
  },

  checkLockout: () => {
    const state = get()
    if (state.lockout.lockedUntil && state.lockout.lockedUntil <= Date.now()) {
      set({ lockout: { attempts: 0, lockedUntil: null } })
    }
  },
}))
