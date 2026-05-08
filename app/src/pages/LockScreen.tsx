import { useState } from 'react'
import { useAuthStore } from '../store/auth'
import { deriveKey, verifyPassword } from '../lib/crypto'
import { getSetting } from '../lib/db'
import { glass, colors, font, cs } from '../lib/theme'

interface Props {
  onUnlock: (key: any) => void
}

export function LockScreen({ onUnlock }: Props) {
  const { lockout, checkLockout } = useAuthStore()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isActuallyLocked = lockout.lockedUntil && lockout.lockedUntil > Date.now()

  async function handleUnlock() {
    setError('')
    setLoading(true)
    try {
      const salt = await getSetting('encryption_salt')
      if (!salt) {
        setError('Not initialized')
        return
      }

      if (!verifyPassword(password, salt)) {
        const { lockout: newLockout } = useAuthStore.getState()
        // Try to unlock — the store will handle the attempt counting
        try {
          await useAuthStore.getState().unlock(password)
        } catch {
          // The store's unlock already incremented attempt counter
        }

        const state = useAuthStore.getState().lockout
        if (state.lockedUntil && state.lockedUntil > Date.now()) {
          const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000)
          setError(`Locked for ${remaining}s`)
        } else {
          setError('Wrong password')
        }
        checkLockout()
        setLoading(false)
        return
      }

      // Password verified — derive full key
      const { key } = deriveKey(password, salt)
      onUnlock(key)
      useAuthStore.setState({ isLocked: false, lockout: { attempts: 0, lockedUntil: null } })
    } catch {
      setError('Unlock failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      ...glass.root, height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 24,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
    }}>
      {/* Logo area */}
      <div style={cs(glass.elevated, {
        width: 80, height: 80, borderRadius: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
      })}>
        <span style={{ fontSize: 36 }}>{'\u{1F512}'}</span>
      </div>

      <h1 style={{ ...font.title, marginBottom: 4 }}>MeMeMe</h1>
      <p style={{ ...font.caption, marginBottom: 32 }}>Enter master password to unlock</p>

      {/* Password input — frosted card */}
      <div style={cs(glass.surface, {
        width: '100%', maxWidth: 320, padding: 4,
        display: 'flex', alignItems: 'center',
      })}>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          placeholder="Master Password"
          disabled={isActuallyLocked}
          autoFocus
          style={{
            flex: 1, padding: '14px 16px',
            background: 'transparent', border: 'none',
            color: colors.text, fontSize: 18, outline: 'none',
            textAlign: 'center',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {error && (
        <p style={{ color: colors.error, fontSize: 13, marginTop: 12, textAlign: 'center' }}>{error}</p>
      )}

      {isActuallyLocked && (
        <div style={cs(glass.control, {
          marginTop: 12, padding: '10px 20px',
        })}>
          <p style={{ color: colors.warning, fontSize: 13, margin: 0, textAlign: 'center' }}>
            Locked · {Math.ceil((lockout.lockedUntil! - Date.now()) / 1000)}s remaining
          </p>
        </div>
      )}

      <button
        onClick={handleUnlock}
        disabled={loading || isActuallyLocked || !password}
        style={cs(glass.accent, {
          width: '100%', maxWidth: 320, marginTop: 20,
          padding: 14, fontSize: 16, fontWeight: 600,
          cursor: loading || isActuallyLocked ? 'not-allowed' : 'pointer',
          opacity: loading || isActuallyLocked ? 0.5 : 1,
          transition: 'all 0.2s',
        })}
      >
        {loading ? 'Verifying...' : 'Unlock'}
      </button>
    </div>
  )
}
