import { useState } from 'react'
import { INTEGRITY_CONTRACTS } from '../../constants/contracts'
import { saveApiKey, clearApiKey, getApiKey } from '../../lib/storage'
import { clearState } from '../../lib/storage'
import { Bar } from '../ui/Bar'

export function MeView({ state, setState, mc, level, levelPct, nextLevel, consPct, setModal }) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importTxt, setImportTxt] = useState('')
  const [apiKey, setApiKey] = useState(() => getApiKey())
  const [keySaved, setKeySaved] = useState(false)
  const [showKey, setShowKey] = useState(false)

  function handleSaveKey() {
    saveApiKey(apiKey)
    setKeySaved(true)
    setTimeout(() => setKeySaved(false), 2000)
  }

  function handleClearKey() {
    clearApiKey()
    setApiKey('')
  }

  function handleExport() {
    const cfg = { habits: state.habits, username: state.username, missions: state.missions }
    navigator.clipboard?.writeText(JSON.stringify(cfg))
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2000)
  }

  function handleImport() {
    try {
      const cfg = JSON.parse(importTxt)
      if (cfg.habits) {
        setState(s => ({ ...s, habits: cfg.habits, username: cfg.username || s.username, missions: cfg.missions || s.missions }))
        setShowImport(false)
        setImportTxt('')
      }
    } catch {
      alert('Invalid config.')
    }
  }

  function handleReset() {
    clearState()
    window.location.reload()
  }

  const hasKey = apiKey.trim().length > 10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Identity */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: '0.1em', color: '#e7e5e4', lineHeight: 1 }}>{state.username}</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 12, color: level.color, letterSpacing: '0.2em', marginTop: 4 }}>{level.name}</div>
        <div style={{ marginTop: 12 }}><Bar pct={levelPct} color={level.color} /></div>
        <div style={{ fontSize: 10, color: '#44403c', marginTop: 6 }}>
          {nextLevel ? `${(nextLevel.min - state.totalXP).toLocaleString()} XP to ${nextLevel.name}` : 'MAX LEVEL'}
        </div>
        <div style={{ fontSize: 11, color: '#57534e', marginTop: 8 }}>
          Lifetime consistency: <span style={{ color: consPct >= 70 ? '#10b981' : '#f59e0b' }}>{consPct}%</span>
        </div>
      </div>

      {/* JARVIS API Key */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 6 }}>JARVIS KEY</div>
        <div style={{ fontSize: 10, color: hasKey ? '#10b981' : '#ef4444', marginBottom: 10 }}>
          {hasKey ? 'Key active. JARVIS operational.' : 'No key. JARVIS offline.'}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
            style={{ flex: 1, padding: '8px 10px', background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 6, color: '#d6d3d1', fontSize: 11, outline: 'none' }}
          />
          <button onClick={() => setShowKey(!showKey)} style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 6, color: '#44403c', fontSize: 9, cursor: 'pointer' }}>
            {showKey ? 'HIDE' : 'SHOW'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSaveKey} style={{ flex: 1, padding: 9, background: mc.accent + '11', border: `1px solid ${mc.accent}33`, borderRadius: 7, color: mc.accent, fontSize: 10, cursor: 'pointer' }}>
            {keySaved ? 'SAVED' : 'SAVE KEY'}
          </button>
          {hasKey && (
            <button onClick={handleClearKey} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', fontSize: 10, cursor: 'pointer' }}>
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Integrity Contracts */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>INTEGRITY CONTRACTS</div>
        {INTEGRITY_CONTRACTS.map(c => (
          <div key={c.id} style={{ padding: '8px 0', borderBottom: `1px solid ${mc.border}` }}>
            <div style={{ fontSize: 9, color: '#57534e', letterSpacing: '0.08em', marginBottom: 2 }}>#{c.id} — {c.short.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: '#44403c', lineHeight: 1.6 }}>{c.full}</div>
          </div>
        ))}
      </div>

      {/* Directives */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>DIRECTIVES</span>
          <button onClick={() => setModal('habit')} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 4, color: '#44403c', fontSize: 9, cursor: 'pointer' }}>+ ADD</button>
        </div>
        {state.habits.map(h => (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: `1px solid ${mc.border}` }}>
            <span style={{ fontSize: 15 }}>{h.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#d6d3d1' }}>{h.label}</div>
              <div style={{ fontSize: 9, color: '#44403c' }}>+{h.xp} XP{h.locked ? ' · CORE' : ''}</div>
            </div>
            {!h.locked && (
              <button
                onClick={() => setState(s => ({ ...s, habits: s.habits.filter(x => x.id !== h.id) }))}
                style={{ padding: '3px 7px', background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 4, color: '#f87171', fontSize: 9, cursor: 'pointer' }}
              >X</button>
            )}
          </div>
        ))}
      </div>

      {/* Security */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>SECURITY</div>
        <button onClick={() => setModal('pin')} style={{ padding: '9px 14px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>
          {state.pin ? 'CHANGE PIN' : 'SET PIN'}
        </button>
        {state.pin && (
          <button onClick={() => setState(s => ({ ...s, pin: null }))} style={{ marginLeft: 8, padding: '9px 14px', background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', fontSize: 10, cursor: 'pointer' }}>
            REMOVE PIN
          </button>
        )}
      </div>

      {/* Cross-device */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>CROSS-DEVICE</div>
        <div style={{ fontSize: 10, color: '#44403c', lineHeight: 1.8, marginBottom: 12 }}>
          Share habit config (not progress) to other devices. Each device keeps its own journey.
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={{ padding: '9px 14px', background: mc.accent + '11', border: `1px solid ${mc.accent}33`, borderRadius: 7, color: mc.accent, fontSize: 10, cursor: 'pointer' }}>
            {exportDone ? 'COPIED' : 'COPY CONFIG'}
          </button>
          <button onClick={() => setShowImport(!showImport)} style={{ padding: '9px 14px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>
            IMPORT
          </button>
        </div>
        {showImport && (
          <div style={{ marginTop: 10 }}>
            <textarea value={importTxt} onChange={e => setImportTxt(e.target.value)} placeholder="Paste config JSON here..." style={{ width: '100%', padding: '8px 10px', background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 6, color: '#d6d3d1', fontSize: 11, outline: 'none', height: 60, resize: 'vertical' }} />
            <button onClick={handleImport} style={{ marginTop: 8, width: '100%', padding: 9, background: mc.accent + '11', border: `1px solid ${mc.accent}33`, borderRadius: 7, color: mc.accent, fontSize: 10, cursor: 'pointer' }}>
              APPLY
            </button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#ef4444', marginBottom: 10 }}>DANGER ZONE</div>
        {!confirmReset ? (
          <button onClick={() => setConfirmReset(true)} style={{ width: '100%', padding: 9, background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', fontSize: 10, cursor: 'pointer' }}>
            RESET ALL PROGRESS
          </button>
        ) : (
          <div>
            <div style={{ fontSize: 11, color: '#f87171', marginBottom: 10 }}>This wipes everything. No undo.</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={{ padding: '9px 14px', background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', fontSize: 10, cursor: 'pointer' }}>YES, RESET</button>
              <button onClick={() => setConfirmReset(false)} style={{ padding: '9px 14px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
