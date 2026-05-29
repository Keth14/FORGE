export function Bar({ pct, color, height = 7 }) {
  return (
    <div style={{
      height,
      background: 'rgba(255,255,255,0.04)',
      borderRadius: 99,
      overflow: 'hidden',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(pct, 100)}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.8s ease',
        boxShadow: `0 0 6px ${color}44`,
      }} />
    </div>
  )
}

export function PsychBar({ label, value, color, invert = false }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid #1c1917',
      borderRadius: 8,
      padding: '10px 12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 8, letterSpacing: '0.15em', color: '#44403c' }}>{label}</span>
        <span style={{
          fontSize: 10,
          color,
          fontFamily: "'Bebas Neue', sans-serif",
        }}>{value}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${value}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.8s ease, background 1s',
        }} />
      </div>
      {invert && value > 50 && (
        <div style={{ fontSize: 8, color, marginTop: 4, opacity: 0.7 }}>elevated</div>
      )}
      {!invert && value < 40 && (
        <div style={{ fontSize: 8, color, marginTop: 4, opacity: 0.7 }}>low</div>
      )}
    </div>
  )
}
