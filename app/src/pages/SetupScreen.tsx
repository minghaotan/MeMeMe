import { useState } from 'react'
import { useAuthStore, PASSWORD_POLICY } from '../store/auth'
import { glass, colors, font, cs } from '../lib/theme'

export function SetupScreen() {
  const { initialize, validatePasswordStrength } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSetup() {
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    const strengthErr = validatePasswordStrength(password)
    if (strengthErr) {
      setError(strengthErr)
      return
    }
    setLoading(true)
    try {
      await initialize(password)
    } catch (err: any) {
      setError(err.message || 'Initialization failed')
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
      {/* Logo */}
      <div style={cs(glass.elevated, {
        width: 80, height: 80, borderRadius: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
      })}>
        <span style={{ fontSize: 36 }}>{'\u{2728}'}</span>
      </div>

      <h1 style={{ ...font.title, marginBottom: 4 }}>MeMeMe</h1>
      <p style={{ ...font.caption, marginBottom: 32, textAlign: 'center', maxWidth: 280 }}>
        Your private vault. Set a master password to encrypt all your data locally.
      </p>

      {/* Form card */}
      <div style={cs(glass.surface, {
        width: '100%', maxWidth: 340, padding: 20,
      })}>
        <label style={cs(font.label, { display: 'block', marginBottom: 6 })}>
          Master Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder={`Min ${PASSWORD_POLICY.minLength} chars, upper + lower + digit`}
          style={inputStyle}
        />

        <label style={cs(font.label, { display: 'block', marginTop: 16, marginBottom: 6 })}>
          Confirm Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Re-enter password"
          style={inputStyle}
        />

        {/* Strength indicator */}
        {password.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', gap: 4 }}>
            {[
              { ok: password.length >= PASSWORD_POLICY.minLength, label: 'Length' },
              { ok: /[A-Z]/.test(password), label: 'Upper' },
              { ok: /[a-z]/.test(password), label: 'Lower' },
              { ok: /[0-9]/.test(password), label: 'Digit' },
            ].map(({ ok, label }) => (
              <div key={label} style={cs(glass.control, {
                flex: 1, padding: '6px 0', textAlign: 'center',
                fontSize: 10, fontWeight: 600,
                color: ok ? colors.success : colors.textTertiary,
                borderColor: ok ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255,255,255,0.06)',
              })}>
                {label}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p style={{ color: colors.error, fontSize: 13, marginTop: 12 }}>{error}</p>
        )}
      </div>

      <button
        onClick={handleSetup}
        disabled={loading}
        style={cs(glass.accent, {
          width: '100%', maxWidth: 340, marginTop: 20,
          padding: 14, fontSize: 16, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
          transition: 'all 0.2s',
        })}
      >
        {loading ? 'Initializing...' : 'Create Vault'}
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 14, color: colors.text, fontSize: 15, outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}
