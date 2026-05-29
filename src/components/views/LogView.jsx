import { todayStr } from '../../lib/storage'

export function LogView({ state, mc, setModal }) {
  const entries = Object.entries(state.history).sort(([a], [b]) => (a < b ? 1 : -1))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>MISSION LOG</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['weekly', 'WEEK'], ['photo', 'PHOTO'], ['body', 'BODY']].map(([id, label]) => (
            <button key={id} onClick={() => setModal(id)} style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${mc.border}`, borderRadius: 4, color: '#44403c', fontSize: 9, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {entries.length === 0 && (
        <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 20, textAlign: 'center', fontSize: 11, color: '#292524' }}>
          No entries yet.
        </div>
      )}

      {entries.map(([date, data]) => {
        const done = state.habits.filter(h => data.checks?.[h.id]).length
        const pct = Math.round((done / state.habits.length) * 100)
        const hasComments = Object.values(data.comments || {}).some(Boolean)
        return (
          <div key={date} style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: hasComments ? 8 : 0 }}>
              <div style={{ fontSize: 10, color: '#44403c', width: 82, flexShrink: 0 }}>{date}</div>
              <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? mc.accent : pct >= 50 ? '#3b82f6' : '#292524', borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 10, color: '#44403c', minWidth: 28, textAlign: 'right' }}>{done}/{state.habits.length}</div>
              <div style={{ fontSize: 10, color: mc.accent, minWidth: 40, textAlign: 'right' }}>+{data.xpEarned || 0}</div>
            </div>
            {hasComments && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(data.comments || {}).filter(([, v]) => v).map(([hid, c]) => {
                  const h = state.habits.find(x => x.id === hid)
                  return (
                    <div key={hid} style={{ fontSize: 10, color: '#44403c', lineHeight: 1.6 }}>
                      <span style={{ color: '#57534e' }}>{h ? `${h.icon} ${h.label}` : ''}: </span>{c}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {state.photoLog?.length > 0 && (
        <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>PROGRESS SNAPSHOTS</div>
          {state.photoLog.slice().reverse().map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: `1px solid ${mc.border}`, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: mc.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📸</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: '#44403c' }}>Fortnight {p.fortnight} · {p.date}</div>
                <div style={{ fontSize: 11, color: '#d6d3d1', marginTop: 2 }}>{p.note || 'No notes.'}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.bodyLog?.length > 0 && (
        <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>BODY LOG</div>
          {state.bodyLog.slice(-5).reverse().map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${mc.border}` }}>
              <div style={{ fontSize: 10, color: '#44403c', width: 80 }}>{b.date}</div>
              <div style={{ fontSize: 12, color: '#d6d3d1', flex: 1 }}>{b.weight}kg · Energy {b.energy}/10</div>
              <div style={{ fontSize: 10, color: '#57534e' }}>{b.notes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
