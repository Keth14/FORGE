import { useEffect, useState } from 'react'

export function JarvisOverlay({ loading, text, onClose }) {
  const [typewritten, setTypewritten] = useState('')

  useEffect(() => {
    if (!text) return
    setTypewritten('')
    let i = 0
    const iv = setInterval(() => {
      setTypewritten(text.slice(0, i))
      i++
      if (i > text.length) clearInterval(iv)
    }, 14)
    return () => clearInterval(iv)
  }, [text])

  return (
    <div
      onClick={() => !loading && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(12px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0a0d12',
          border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 12, padding: 20,
          maxWidth: 480, width: '100%',
          maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 16, paddingBottom: 12,
          borderBottom: '1px solid rgba(96,165,250,0.1)',
        }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '0.2em', color: '#60a5fa' }}>
              J.A.R.V.I.S
            </div>
            <div style={{ fontSize: 8, color: '#1d4ed8', letterSpacing: '0.2em' }}>
              BEHAVIORAL INFERENCE ENGINE
            </div>
          </div>
          {!loading && (
            <button
              onClick={onClose}
              style={{
                padding: '5px 10px', background: 'transparent',
                border: '1px solid rgba(96,165,250,0.2)',
                borderRadius: 5, color: '#60a5fa',
                fontSize: 9, cursor: 'pointer',
              }}
            >
              DISMISS
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#44403c', fontSize: 12, padding: '20px 0' }}>
            <span style={{ display: 'inline-flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#3b82f6', display: 'inline-block',
                  animation: `dotPulse 1s ease ${i * 0.2}s infinite`,
                }} />
              ))}
            </span>
            Analyzing patterns...
          </div>
        ) : (
          <div style={{
            fontSize: 12, color: '#93c5fd',
            lineHeight: 1.9, whiteSpace: 'pre-wrap',
            fontFamily: "'DM Mono', monospace",
          }}>
            {typewritten}
            <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
          </div>
        )}
      </div>
    </div>
  )
}
