import { useState, useEffect } from 'react'
import { useAppContext } from '../lib/context'
import { glass, colors, font, layout, cs } from '../lib/theme'
import type { MediaItem } from '@mememe/shared'

export function FamilyCloud() {
  const { syncConfig } = useAppContext()
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<MediaItem | null>(null)

  useEffect(() => {
    if (!syncConfig) { setLoading(false); return }
    async function fetchPublic() {
      try {
        const res = await fetch(`${syncConfig!.serverUrl}/api/media/public`, {
          headers: { Authorization: `Bearer ${syncConfig!.token}` },
        })
        const json = await res.json()
        if (json.success) setPhotos(json.data)
      } catch {
        // Offline
      } finally {
        setLoading(false)
      }
    }
    fetchPublic()
  }, [syncConfig])

  async function handleCopy(mediaId: string) {
    if (!syncConfig) return
    try {
      await fetch(`${syncConfig.serverUrl}/api/media/${mediaId}/copy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${syncConfig.token}` },
      })
      setCopiedIds(prev => new Set(prev).add(mediaId))
    } catch {
      // silently fail
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: `12px ${layout.pagePadding}px 8px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ ...font.heading, margin: 0 }}>Family Cloud</h2>
          <p style={{ ...font.caption, margin: '2px 0 0 0', fontSize: 11 }}>Public photos from family members</p>
        </div>
        <span style={cs(glass.control, {
          padding: '6px 12px', fontSize: 12, borderRadius: 20,
        })}>
          {photos.length}
        </span>
      </div>

      {loading ? (
        <p style={{ ...font.caption, textAlign: 'center', marginTop: 60 }}>Loading...</p>
      ) : photos.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 80 }}>
          <div style={cs(glass.surface, {
            width: 56, height: 56, borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          })}>
            <span style={{ fontSize: 24 }}>{'\u{2601}'}</span>
          </div>
          <p style={{ ...font.caption, margin: 0 }}>No shared photos yet</p>
          <p style={{ ...font.label, color: colors.textTertiary, marginTop: 4 }}>Family members haven't shared anything</p>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: `0 ${layout.pagePadding}px`,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
        }}>
          {photos.map(p => (
            <div
              key={p.id}
              style={cs(glass.surface, {
                aspectRatio: '1', overflow: 'hidden',
                borderRadius: 14, padding: 0, border: 'none',
                background: 'rgba(255,255,255,0.04)',
                position: 'relative',
              })}
            >
              {/* Thumbnail — tap to view */}
              <div
                onClick={() => setSelected(p)}
                style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              >
                {p.thumbnailId && syncConfig ? (
                  <img
                    src={`${syncConfig.serverUrl}/api/media/${p.thumbnailId}/file`}
                    alt={p.filename}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: colors.textTertiary, fontSize: 11,
                  }}>
                    {p.filename}
                  </div>
                )}
              </div>

              {/* Copy badge */}
              {copiedIds.has(p.id) ? (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  background: 'rgba(34, 197, 94, 0.4)',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  color: '#fff', fontSize: 10,
                  padding: '3px 8px', borderRadius: 10,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}>
                  Saved
                </span>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopy(p.id) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', fontSize: 10,
                    padding: '3px 10px', borderRadius: 10,
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              )}

              {/* Description overlay */}
              {p.metadata?.description && (
                <span style={{
                  position: 'absolute', bottom: 6, left: 6,
                  background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  color: '#fff', fontSize: 10,
                  padding: '2px 8px', borderRadius: 8,
                  maxWidth: 'calc(100% - 12px)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.metadata.description}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <div style={cs(glass.surface, {
        margin: '8px 12px 0', padding: '10px 14px',
        textAlign: 'center',
      })}>
        <p style={{ ...font.caption, margin: 0, fontSize: 11 }}>
          Tap a photo to view · Tap <b>Save</b> to keep a local offline copy
        </p>
      </div>

      {/* Full-screen viewer */}
      {selected && syncConfig && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <img
            src={`${syncConfig.serverUrl}/api/media/${selected.id}/file`}
            alt={selected.filename}
            style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 12 }}
          />
          {/* Action bar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(selected.id) }}
              style={cs(glass.accent, {
                padding: '10px 24px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              })}
            >
              {copiedIds.has(selected.id) ? 'Saved' : 'Save Copy'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(null) }}
              style={cs(glass.control, {
                padding: '10px 24px', fontSize: 14, color: colors.textSecondary,
                cursor: 'pointer',
              })}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
