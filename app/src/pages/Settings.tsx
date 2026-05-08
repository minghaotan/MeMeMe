import { useState, useEffect } from 'react'
import { useAppContext, SyncHostConfig } from '../lib/context'
import { useSyncStore } from '../store/sync'
import { useAuthStore } from '../store/auth'
import { glass, colors, font, layout, cs } from '../lib/theme'

export function Settings() {
  const { syncConfig, setSyncConfig } = useAppContext()
  const { status, checkAndSync, isOnline } = useSyncStore()
  const { lock } = useAuthStore()

  const [serverUrl, setServerUrl] = useState(syncConfig?.serverUrl || '')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('meme_server_url')
    if (saved && !syncConfig) setServerUrl(saved)
  }, [syncConfig])

  async function handleConnect() {
    setConnecting(true)
    setMessage('')
    try {
      const res = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          deviceName: navigator.userAgent?.slice(0, 20) || 'browser',
          deviceType: 'desktop',
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setMessage('Login failed: ' + (json.error || 'unknown'))
        return
      }

      const { token, deviceId } = json.data
      const cfg: SyncHostConfig = { serverUrl, token, deviceId }
      setSyncConfig(cfg)
      localStorage.setItem('meme_server_url', serverUrl)
      setMessage('Connected! Background sync is active.')
    } catch {
      setMessage('Cannot reach server. Check URL and network.')
    } finally {
      setConnecting(false)
    }
  }

  function formatTime(ts: number | null): string {
    if (!ts) return 'Never'
    return new Date(ts).toLocaleString('zh-CN', {
      hour: '2-digit', minute: '2-digit',
      month: 'short', day: 'numeric',
    })
  }

  return (
    <div style={{
      height: '100%', overflow: 'auto', padding: `12px ${layout.pagePadding}px 24px`,
      fontFamily: 'inherit',
    }}>
      <h2 style={{ ...font.heading, marginTop: 0, marginBottom: 16 }}>Settings</h2>

      {/* Server Connection */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={cs(font.label, { marginBottom: 10 })}>Server Connection</h3>
        <div style={cs(glass.surface, { padding: layout.cardPadding })}>
          <label style={inputLabel}>Server URL</label>
          <input
            value={serverUrl}
            onChange={e => setServerUrl(e.target.value)}
            placeholder="http://192.168.1.x:3001"
            style={inputStyle}
          />

          <label style={inputLabel}>Username</label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Admin-assigned username"
            style={inputStyle}
          />

          <label style={inputLabel}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Server account password"
            style={inputStyle}
          />

          {message && (
            <p style={{
              fontSize: 13, marginTop: 10, marginBottom: 0,
              color: message.includes('Connected') ? colors.success : colors.error,
            }}>
              {message}
            </p>
          )}

          <button onClick={handleConnect} disabled={connecting} style={cs(glass.accent, {
            width: '100%', marginTop: 14, padding: 12,
            fontSize: 14, fontWeight: 600, cursor: connecting ? 'not-allowed' : 'pointer',
            opacity: connecting ? 0.5 : 1,
          })}>
            {connecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
      </section>

      {/* Sync Status */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={cs(font.label, { marginBottom: 10 })}>Sync Status</h3>
        <div style={cs(glass.surface, { padding: layout.cardPadding })}>
          <Row label="Connection" value={isOnline ? 'Online' : 'Offline'} />
          <Row label="Last Sync" value={formatTime(status.lastSyncAt)} />
          <Row label="Pending Push" value={String(status.pendingPushCount)} />
          <Row label="Pending Pull" value={String(status.pendingPullCount)} />

          <button
            onClick={checkAndSync}
            disabled={!isOnline}
            style={cs(glass.control, {
              width: '100%', marginTop: 12, padding: 10,
              fontSize: 13, fontWeight: 500, color: colors.textSecondary,
              cursor: isOnline ? 'pointer' : 'not-allowed',
              opacity: isOnline ? 1 : 0.4,
            })}
          >
            Sync Now
          </button>
        </div>
      </section>

      {/* Security */}
      <section style={{ marginBottom: 20 }}>
        <h3 style={cs(font.label, { marginBottom: 10 })}>Security</h3>
        <button onClick={lock} style={cs(glass.danger, {
          width: '100%', padding: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        })}>
          Lock App
        </button>
        <p style={{ ...font.caption, marginTop: 8, fontSize: 11, textAlign: 'center' }}>
          App locks automatically when sent to background
        </p>
      </section>

      {/* About */}
      <p style={{ ...font.label, color: colors.textTertiary, textAlign: 'center', marginTop: 32 }}>
        MeMeMe v0.1.0 — Your Private Vault
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: `1px solid ${colors.separator}`,
    }}>
      <span style={{ fontSize: 13, color: colors.textSecondary }}>{label}</span>
      <span style={{ fontSize: 13, color: colors.text, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', marginTop: 4, marginBottom: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 14, color: colors.text, fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

const inputLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: colors.textTertiary,
  display: 'block', marginTop: 6,
  textTransform: 'uppercase', letterSpacing: '0.5px',
}
