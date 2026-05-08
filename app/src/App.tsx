import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from './store/auth'
import { useSyncStore } from './store/sync'
import { getSetting } from './lib/db'
import { deriveKey } from './lib/crypto'
import { AppContext, AppContextType, SyncHostConfig } from './lib/context'
import { LockScreen } from './pages/LockScreen'
import { SetupScreen } from './pages/SetupScreen'
import { VaultList } from './pages/VaultList'
import { ItemDetail } from './pages/ItemDetail'
import { Photos } from './pages/Photos'
import { FamilyCloud } from './pages/FamilyCloud'
import { Settings } from './pages/Settings'
import { useBackgroundSync } from './lib/useBackgroundSync'
import { glass, colors, font, cs } from './lib/theme'

type Tab = 'vault' | 'photos' | 'family' | 'settings'

const tabs: { key: Tab; label: string; icon: string }[] = [
  { key: 'vault', label: 'Vault', icon: '\u{1F512}' },
  { key: 'photos', label: 'Photos', icon: '\u{1F4F7}' },
  { key: 'family', label: 'Cloud', icon: '\u{2601}' },
  { key: 'settings', label: 'Settings', icon: '\u{2699}' },
]

export function App() {
  const { isLocked, isInitialized, lock, checkLockout, encryptionSalt } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('vault')
  const [showAdd, setShowAdd] = useState(false)
  const [encryptionKey, setEncryptionKey] = useState<any>(null)
  const [syncConfig, setSyncConfigState] = useState<SyncHostConfig | null>(null)

  // Bootstrap
  useEffect(() => {
    async function bootstrap() {
      try {
        const init = await getSetting('initialized')
        if (init === 'true') {
          const salt = await getSetting('encryption_salt')
          useAuthStore.setState({ isInitialized: true, isLocked: true, encryptionSalt: salt })
        }
      } catch {
        // First launch
      } finally {
        setLoading(false)
      }
    }
    bootstrap()
  }, [])

  // Lock when app goes to background
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) lock()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [lock])

  // Periodic lockout clear check
  useEffect(() => {
    const interval = setInterval(checkLockout, 10_000)
    return () => clearInterval(interval)
  }, [checkLockout])

  // Derive encryption key when user unlocks with password
  // This is handled by LockScreen calling setEncryptionKey after successful unlock

  const setSyncConfig = useCallback((cfg: SyncHostConfig) => {
    setSyncConfigState(cfg)
    useSyncStore.getState().configure(cfg)
  }, [])

  useBackgroundSync()

  const appContext: AppContextType = {
    encryptionKey,
    syncConfig,
    setSyncConfig,
  }

  if (loading) {
    return (
      <div style={{ ...glass.root, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: colors.textSecondary }}>Loading...</span>
      </div>
    )
  }

  if (!isInitialized) return <SetupScreen />
  if (isLocked) {
    return (
      <LockScreen
        onUnlock={(key) => {
          setEncryptionKey(key)
          useAuthStore.setState({ isLocked: false })
        }}
      />
    )
  }

  // Main app
  return (
    <AppContext.Provider value={appContext}>
      <div style={{ ...glass.root, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif' }}>
        {/* Header — frosted glass */}
        <header style={cs(glass.surface, {
          padding: '16px 20px',
          margin: '12px 12px 0 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        })}>
          <h1 style={{ ...font.title, margin: 0, fontSize: 20 }}>
            MeMeMe
          </h1>
          <button
            onClick={lock}
            style={cs(glass.control, {
              padding: '8px 16px',
              color: colors.textSecondary,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
            })}
          >
            Lock
          </button>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {tab === 'vault' && <VaultList />}
          {tab === 'photos' && <Photos />}
          {tab === 'family' && <FamilyCloud />}
          {tab === 'settings' && <Settings />}
        </main>

        {/* FAB — add item */}
        {tab === 'vault' && (
          <button
            onClick={() => setShowAdd(true)}
            style={cs(glass.accent, {
              position: 'fixed',
              bottom: 100,
              right: 20,
              width: 52,
              height: 52,
              fontSize: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 50,
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
            })}
          >
            +
          </button>
        )}

        {/* Tab bar — frosted glass */}
        <nav style={cs(glass.surface, {
          display: 'flex',
          padding: '6px 8px',
          margin: '0 12px 12px 12px',
          gap: 2,
        })}>
          {tabs.map(t => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={cs(
                  active ? glass.controlActive : glass.control,
                  {
                    flex: 1,
                    padding: '8px 4px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#e8e8f0' : colors.textSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.2s',
                  }
                )}
              >
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Add/Edit modal */}
      {showAdd && <ItemDetail onClose={() => setShowAdd(false)} />}
    </AppContext.Provider>
  )
}
