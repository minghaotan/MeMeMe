// Apple Liquid Glass design system.
// Used across iOS, Android, and Desktop — consistent frosted-glass aesthetic.

export const glass = {
  // Frosted glass surface — main card/sheet background
  surface: {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
  },

  // Elevated surface — modals, dropdowns
  elevated: {
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(32px) saturate(200%)',
    WebkitBackdropFilter: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255,255,255,0.1) inset',
  },

  // Translucent control — buttons, inputs, tabs
  control: {
    background: 'rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },

  // Active control — selected tab, pressed button
  controlActive: {
    background: 'rgba(255, 255, 255, 0.16)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.20)',
    borderRadius: 14,
  },

  // Accent button
  accent: {
    background: 'rgba(59, 130, 246, 0.75)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    border: '1px solid rgba(96, 165, 250, 0.3)',
    borderRadius: 16,
    color: '#fff',
  },

  // Danger / destructive
  danger: {
    background: 'rgba(239, 68, 68, 0.6)',
    backdropFilter: 'blur(12px) saturate(160%)',
    WebkitBackdropFilter: 'blur(12px) saturate(160%)',
    border: '1px solid rgba(248, 113, 113, 0.3)',
    borderRadius: 16,
    color: '#fff',
  },

  // Root background — deep dark with subtle gradient
  root: {
    background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 40%, #0c0c24 100%)',
    minHeight: '100vh',
  },
} as const

// Colors
export const colors = {
  primary: '#60a5fa',
  primaryDim: '#3b82f6',
  text: '#e8e8f0',
  textSecondary: '#9898b0',
  textTertiary: '#646480',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  separator: 'rgba(255, 255, 255, 0.08)',
} as const

// Typography
export const font = {
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.3px',
    color: '#e8e8f0',
  },
  heading: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: '-0.2px',
    color: '#e8e8f0',
  },
  body: {
    fontSize: 14,
    fontWeight: 400,
    color: '#e8e8f0',
  },
  caption: {
    fontSize: 12,
    fontWeight: 400,
    color: '#9898b0',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    color: '#646480',
  },
} as const

// Spacing and layout
export const layout = {
  pagePadding: 16,
  cardPadding: 16,
  gap: 10,
  radius: {
    sm: 10,
    md: 16,
    lg: 20,
    xl: 24,
  },
} as const

// Helper: flatten style object for React
export function cs(...styles: (React.CSSProperties | undefined | false)[]): React.CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean))
}
