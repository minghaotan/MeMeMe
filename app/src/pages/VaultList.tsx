import { useEffect } from 'react'
import { useVaultStore } from '../store/vault'
import { useAppContext } from '../lib/context'
import { glass, colors, font, layout, cs } from '../lib/theme'
import type { BlockType } from '@mememe/shared'

const TYPE_LABELS: Record<BlockType, string> = {
  password: 'Password',
  document: 'Document',
  photo: 'Photo',
  note: 'Note',
  other: 'Other',
}

const TYPE_ICONS: Record<BlockType, string> = {
  password: '\u{1F511}',
  document: '\u{1F4C4}',
  photo: '\u{1F4F7}',
  note: '\u{1F4DD}',
  other: '\u{1F4E6}',
}

export function VaultList() {
  const { encryptionKey } = useAppContext()
  const { items, isLoading, selectedType, setType, getFilteredItems, loadVault } = useVaultStore()

  useEffect(() => {
    if (encryptionKey) {
      loadVault(encryptionKey as any)
    }
  }, [encryptionKey, loadVault])

  const filtered = getFilteredItems()
  const types: (BlockType | 'all')[] = ['all', 'password', 'document', 'photo', 'note']

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Category tabs — frosted glass chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '10px 16px',
        overflowX: 'auto',
      }}>
        {types.map(type => {
          const active = selectedType === type
          return (
            <button
              key={type}
              onClick={() => setType(type)}
              style={cs(
                active ? glass.controlActive : glass.control,
                {
                  padding: '8px 16px',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? '#e8e8f0' : colors.textSecondary,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }
              )}
            >
              {type === 'all' ? 'All' : TYPE_LABELS[type]}
            </button>
          )
        })}
      </div>

      {/* Item list */}
      <div style={{ flex: 1, overflow: 'auto', padding: `4px ${layout.pagePadding}px ${layout.pagePadding}px` }}>
        {isLoading ? (
          <p style={{ ...font.caption, textAlign: 'center', marginTop: 60 }}>Decrypting vault...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={cs(glass.surface, {
              width: 56, height: 56, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            })}>
              <span style={{ fontSize: 24 }}>{'\u{1F4E6}'}</span>
            </div>
            <p style={{ ...font.caption, margin: 0 }}>
              {selectedType === 'all'
                ? 'Your vault is empty'
                : `No ${TYPE_LABELS[selectedType].toLowerCase()} items`}
            </p>
            <p style={{ ...font.label, marginTop: 4, color: colors.textTertiary }}>
              Tap + to add
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: layout.gap }}>
            {filtered.map(item => (
              <div
                key={item.id}
                style={cs(glass.surface, {
                  padding: layout.cardPadding,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  transition: 'transform 0.15s, border-color 0.15s',
                })}
              >
                {/* Icon */}
                <div style={cs(glass.control, {
                  width: 42, height: 42, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                })}>
                  {TYPE_ICONS[item.type]}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    ...font.body, margin: 0, fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </p>
                  <p style={{ ...font.caption, marginTop: 2 }}>
                    {new Date(item.timestamp).toLocaleDateString('zh-CN', {
                      month: 'short', day: 'numeric',
                    })}
                    {item.tags.length > 0 && (
                      <span style={{ color: colors.primary }}>
                        {' · '}{item.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </p>
                </div>

                {/* Status badge */}
                {item.status === 'hidden' && (
                  <span style={cs(glass.control, {
                    fontSize: 10, color: colors.warning,
                    padding: '4px 10px', borderRadius: 20,
                  })}>
                    Hidden
                  </span>
                )}
                {item.status === 'void' && (
                  <span style={cs(glass.control, {
                    fontSize: 10, color: colors.error,
                    padding: '4px 10px', borderRadius: 20,
                  })}>
                    Void
                  </span>
                )}

                {/* Chevron */}
                <span style={{ color: colors.textTertiary, fontSize: 16 }}>{'\u203A'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
