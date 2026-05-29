import { useState } from 'react'

export function PinLock({ pin, mc, onUnlock }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleKey(k) {
    if (k === '<') { setInput(p => p.slice(0, -1)); return }
    const next = input + k
    setInput(next)
    if (next.length === 4) {
      if (next === pin) {
        onUnlock()
      } else {
        setError(true)
        setTimeout(() => { setInput(''); setError(false) }, 600)
      }
    }
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','<']

  return (
    <div style={{
      minHeight: '100vh',
      background: mc.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
    }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: '0.12em', color: '#e7e5e4' }}>FORGE</div>
      <div style={{ fontSize: 9, color: '#292524', letterSpacing: '0.3em', marginTop: -14 }}>LOCKED</div>

      <div style={{ display: 'flex', gap: 12, margin: '8px 0' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 12, height: 12, borderRadius: '50%',
            background: input.length > i ? (error ? '#ef4444' : mc.accent) : '#1c1917',
            transition: 'background 0.15s',
          }} />
        ))}
      </div>

      {error && <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: '0.1em' }}>WRONG PIN</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => k && handleKey(k)}
            style={{
              width: 68, height: 68,
              borderRadius: 12,
              background: k ? '#1c1917' : 'transparent',
              border: k ? '1px solid #292524' : 'none',
              color: '#e7e5e4',
              fontSize: 20,
              cursor: k ? 'pointer' : 'default',
              opacity: k ? 1 : 0,
              fontFamily: "'Bebas Neue', sans-serif",
              letterSpacing: '0.1em',
            }}
          >
            {k}
          </button>
        ))}
      </div>
    </div>
  )
}
