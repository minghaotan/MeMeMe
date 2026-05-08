// Client-side AES-256-GCM encryption.
// All sensitive data is encrypted with a key derived from the master password via PBKDF2.

import CryptoJS from 'crypto-js'

const PBKDF2_ITERATIONS = 600_000
const KEY_SIZE = 256 / 32 // words for AES-256

export interface EncryptionKey {
  key: CryptoJS.lib.WordArray
  salt: string // hex, stored to verify password later
}

export function deriveKey(password: string, salt?: string): EncryptionKey {
  const actualSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString(CryptoJS.enc.Hex)
  const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(actualSalt), {
    keySize: KEY_SIZE,
    iterations: PBKDF2_ITERATIONS,
  })
  return { key, salt: actualSalt }
}

export function encrypt(plaintext: string, key: CryptoJS.lib.WordArray): string {
  const iv = CryptoJS.lib.WordArray.random(96 / 8)
  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.NoPadding,
  })
  // Prepend IV to ciphertext
  const ivHex = iv.toString(CryptoJS.enc.Hex)
  return ivHex + ':' + encrypted.toString()
}

export function decrypt(ciphertext: string, key: CryptoJS.lib.WordArray): string {
  const [ivHex, encrypted] = ciphertext.split(':')
  if (!ivHex || !encrypted) {
    throw new Error('Invalid ciphertext format')
  }
  const iv = CryptoJS.enc.Hex.parse(ivHex)
  const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
    iv,
    mode: CryptoJS.mode.GCM,
    padding: CryptoJS.pad.NoPadding,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export function verifyPassword(password: string, salt: string): boolean {
  try {
    const { key } = deriveKey(password, salt)
    return key !== undefined
  } catch {
    return false
  }
}
