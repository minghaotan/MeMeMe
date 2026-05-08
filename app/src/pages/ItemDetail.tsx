import { useState, useEffect } from 'react'
import type { BlockType } from '@mememe/shared'
import { useVaultStore } from '../store/vault'
import { useAppContext } from '../lib/context'
import { glass, colors, font, cs } from '../lib/theme'

interface Props {
  onClose: () => void
  editId?: string
}

export function ItemDetail({ onClose, editId }: Props) {
  const { encryptionKey } = useAppContext()
  const { items, addItem } = useVaultStore()
  const [type, setType] = useState<BlockType>('password')
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState('')
  const [fields, setFields] = useState<{ key: string; value: string }[]>([
    { key: 'username', value: '' },
    { key: 'password', value: '' },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editId) {
      const item = items.find(i => i.id === editId)
      if (item) {
        setType(item.type)
        setTitle(item.title)
        setTags(item.tags.join(', '))
        const entries = Object.entries(item.data).filter(([k]) => k !== 'title')
        setFields(entries.map(([key, value]) => ({ key, value })))
      }
    }
  }, [editId, items])

  function addField() {
    setFields([...fields, { key: '', value: '' }])
  }

  function updateField(index: number, key: string, value: string) {
    setFields(fields.map((f, i) => i === index ? { key, value } : f))
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const data: Record<string, string> = { title: title.trim() }
      for (const { key, value } of fields) {
        if (key.trim()) data[key.trim()] = value
      }
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      await addItem(type, data, tagList, encryptionKey as any)
      onClose()
    } catch (err: any) {
      alert('Save failed: ' + (err.message || 'unknown'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      fontFamily: 'inherit',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Sheet — liquid glass elevated */}
      <div style={cs(glass.elevated, {
        position: 'relative',
        width: '100%', maxWidth: 420, maxHeight: '88vh',
        overflow: 'auto', padding: '24px 20px',
        borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
      })}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.2)',
          margin: '0 auto 16px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ ...font.title, margin: 0, fontSize: 18 }}>{editId ? 'Edit' : 'New'} Item</h2>
          <button onClick={onClose} style={cs(glass.control, {
            width: 32, height: 32, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, color: colors.textSecondary,
          })}>
            {'\u2715'}
          </button>
        </div>

        {/* Type selector */}
        <label style={{ ...font.label, display: 'block', marginBottom: 6 }}>Type</label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['password', 'document', 'note', 'other'] as BlockType[]).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={cs(
                type === t ? glass.controlActive : glass.control,
                {
                  flex: 1, padding: '10px 0', fontSize: 13, fontWeight: type === t ? 600 : 400,
                  color: type === t ? '#e8e8f0' : colors.textSecondary,
                  cursor: 'pointer', transition: 'all 0.15s',
                }
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Title */}
        <label style={{ ...font.label, display: 'block', marginBottom: 6 }}>Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Item name"
          style={inputStyle}
          autoFocus
        />

        {/* Tags */}
        <label style={{ ...font.label, display: 'block', marginTop: 12, marginBottom: 6 }}>Tags</label>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="work, personal (comma-separated)"
          style={inputStyle}
        />

        {/* Custom fields */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={font.label}>Fields</span>
            <button onClick={addField} style={cs(glass.control, {
              padding: '4px 12px', fontSize: 12, color: colors.primary, cursor: 'pointer',
            })}>
              + Add Field
            </button>
          </div>
          {fields.map((field, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                value={field.key}
                onChange={e => updateField(i, e.target.value, field.value)}
                placeholder="Key"
                style={{ ...inputStyle, flex: 1, marginTop: 0 }}
              />
              <input
                value={field.value}
                onChange={e => updateField(i, field.key, e.target.value)}
                placeholder="Value"
                style={{ ...inputStyle, flex: 2, marginTop: 0 }}
              />
              <button onClick={() => removeField(i)} style={cs(glass.control, {
                width: 32, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: colors.textTertiary, fontSize: 14,
              })}>
                {'\u2715'}
              </button>
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          style={cs(glass.accent, {
            width: '100%', marginTop: 24, padding: 14,
            fontSize: 16, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving || !title.trim() ? 0.5 : 1,
            transition: 'all 0.2s',
          })}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 14, color: '#e8e8f0', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}
