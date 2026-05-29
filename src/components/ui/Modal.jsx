export function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f0e0d',
        border: '1px solid #1c1917',
        borderRadius: 12,
        padding: 20,
        maxWidth: 420,
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  )
}

export function ModalLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 16,
    }}>
      {children}
    </div>
  )
}

export function FieldInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 8, color: '#44403c', letterSpacing: '0.15em', marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 10px',
          background: '#0a0908', border: '1px solid #1c1917',
          borderRadius: 6, color: '#d6d3d1',
          fontSize: 11, outline: 'none',
        }}
      />
    </div>
  )
}
