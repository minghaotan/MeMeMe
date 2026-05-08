import { useState, useEffect } from 'react'
import { useAppContext } from '../lib/context'
import { glass, colors, font, layout, cs } from '../lib/theme'
import type { MediaItem } from '@mememe/shared'

export function Photos() {
  const { syncConfig } = useAppContext()
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MediaItem | null>(null)

  useEffect(() => {
    if (!syncConfig) { setLoading(false); return }
    async function fetchPhotos() {
      try {
        const res = await fetch(`${syncConfig!.serverUrl}/api/media/my`, {
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
    fetchPhotos()
  }, [syncConfig])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ padding: `12px ${layout.pagePadding}px 8px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ ...font.heading, margin: 0 }}>My Photos</h2>
        <span style={{ ...font.caption }}>{photos.length} photos</span>
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
            <span style={{ fontSize: 24 }}>{'\u{1F4F7}'}</span>
          </div>
          <p style={{ ...font.caption, margin: 0 }}>No photos synced yet</p>
          <p style={{ ...font.label, color: colors.textTertiary, marginTop: 4 }}>Upload from the server</p>
        </div>
      ) : (
        <div style={{
          flex: 1, overflow: 'auto', padding: `0 ${layout.pagePadding}px`,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3,
        }}>
          {photos.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={cs(glass.surface, {
                aspectRatio: '1', overflow: 'hidden', cursor: 'pointer',
                borderRadius: 14, padding: 0, border: 'none',
                background: 'rgba(255,255,255,0.04)',
              })}
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
                  color: colors.textTertiary, fontSize: 12,
                }}>
                  No Preview
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Full-screen viewer */}
      {selected && syncConfig && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
        >
          <img
            src={`${syncConfig.serverUrl}/api/media/${selected.id}/file`}
            alt={selected.filename}
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 12 }}
          />
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(null) }}
            style={cs(glass.control, {
              position: 'absolute', top: 20, right: 20,
              width: 40, height: 40, borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#fff', fontSize: 18,
            })}
          >
            {'\u2715'}
          </button>
        </div>
      )}
    </div>
  )
}
