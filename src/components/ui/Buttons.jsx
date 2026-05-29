export function PrimaryBtn({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: 11,
        background: 'rgba(245,158,11,0.07)',
        border: '1px solid rgba(245,158,11,0.18)',
        borderRadius: 7, color: '#fbbf24',
        fontSize: 10, letterSpacing: '0.12em',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function GhostBtn({ children, onClick, disabled, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 14px',
        background: 'transparent',
        border: '1px solid #1c1917',
        borderRadius: 7, color: '#44403c',
        fontSize: 10, letterSpacing: '0.1em',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function DangerBtn({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '9px 14px',
        background: 'transparent',
        border: '1px solid #7f1d1d',
        borderRadius: 7, color: '#f87171',
        fontSize: 10, letterSpacing: '0.1em',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function SmallBtn({ children, onClick, style = {} }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 8px',
        background: 'transparent',
        border: '1px solid #1c1917',
        borderRadius: 4, color: '#44403c',
        fontSize: 9, letterSpacing: '0.1em',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
