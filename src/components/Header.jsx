import { daysUntil } from '../lib/storage'

export function Header({ state, mc, level, effectiveMode }) {
  return (
    <>
      <header style={{
        padding: '14px 16px 10px',
        borderBottom: `1px solid ${mc.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        background: `${mc.bg}f0`,
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'all 1.5s',
      }}>
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 34,
            letterSpacing: '0.12em',
            color: '#e7e5e4',
            lineHeight: 1,
          }}>
            FORGE
          </div>
          <div style={{
            fontSize: 9,
            color: mc.accent,
            letterSpacing: '0.2em',
            marginTop: 2,
            opacity: 0.7,
            transition: 'color 1.5s',
          }}>
            {mc.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: '0.15em',
            color: level.color,
          }}>
            {level.name}
          </div>
          <div style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.08em' }}>
            {state.totalXP.toLocaleString()} XP · DAY {state.dayCount}
          </div>
          <div style={{ fontSize: 9, color: '#292524', letterSpacing: '0.08em' }}>
            STREAK {state.streak}
          </div>
        </div>
      </header>

      {state.missions.length > 0 && (
        <div style={{
          background: mc.cardBg,
          borderBottom: `1px solid ${mc.border}`,
          padding: '6px 14px',
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          transition: 'all 1.5s',
        }}>
          {state.missions.map(m => {
            const d = daysUntil(m.date)
            return (
              <div key={m.id} style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 10,
                color: '#78716c',
                background: mc.bg,
                border: `1px solid ${mc.border}`,
                borderRadius: 99,
                padding: '3px 10px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}>
                {m.emoji} {m.name}
                <span style={{ color: d < 30 ? '#ef4444' : mc.accent, marginLeft: 6 }}>
                  {d < 0 ? 'PAST' : `${d}d`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
