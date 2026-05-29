import { useState } from 'react'
import { Bar, PsychBar } from '../ui/Bar'
import { PrimaryBtn, GhostBtn } from '../ui/Buttons'
import { STABILIZATION_HABITS } from '../../constants/habits'
import { todayStr } from '../../lib/storage'

export function TodayView({
  state, week, checks, comments, doneToday, allDoneToday,
  momentum, drift, resistance, selfBetrayal,
  collapseRisk, patternMatch, contractDivergences,
  mc, level, nextLevel, levelPct,
  toggleHabit, saveComment, advanceDay,
  setModal, runJarvis, acknowledgeAwareness, effectiveMode,
}) {
  const [openComment, setOpenComment] = useState(null)
  const today = todayStr()

  const isStabilization = collapseRisk.phase === 'stabilization'
  const isWatch = collapseRisk.phase === 'watch'
  const isDrift = collapseRisk.phase === 'drift'

  const momentumColor = momentum > 60 ? '#10b981' : momentum > 35 ? mc.accent : '#ef4444'
  const driftColor    = drift > 60 ? '#ef4444' : drift > 30 ? mc.accent : '#10b981'
  const resistColor   = resistance > 60 ? '#ef4444' : resistance > 30 ? mc.accent : '#10b981'
  const betrayColor   = selfBetrayal > 60 ? '#ef4444' : selfBetrayal > 30 ? mc.accent : '#10b981'

  // ── Stabilization mode: stripped UI ───────────────────────────────────────
  if (isStabilization) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          background: 'rgba(96,165,250,0.04)',
          border: '1px solid rgba(96,165,250,0.15)',
          borderRadius: 8,
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: 9, color: '#60a5fa', letterSpacing: '0.2em', marginBottom: 8 }}>
            STABILIZATION PROTOCOL ACTIVE
          </div>
          <div style={{ fontSize: 12, color: '#78716c', lineHeight: 1.8 }}>
            Current behavioral pattern resembles previous destabilization sequence.
            System complexity temporarily reduced until execution stability returns.
          </div>
          {patternMatch && (
            <div style={{
              fontSize: 10, color: '#44403c', marginTop: 8, lineHeight: 1.6,
              borderLeft: '2px solid rgba(96,165,250,0.2)', paddingLeft: 10,
            }}>
              Last similar pattern: {patternMatch.date} (score {patternMatch.score})
            </div>
          )}
        </div>

        <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 12 }}>
            GROUND YOURSELF. NOTHING ELSE.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {STABILIZATION_HABITS.map(h => {
              const done = !!checks[h.id]
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHabit(h.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px', borderRadius: 7, cursor: 'pointer',
                    border: `1px solid ${done ? mc.accent + '33' : mc.border}`,
                    background: done ? mc.accent + '06' : mc.bg,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 3,
                    border: `1px solid ${done ? mc.accent : '#292524'}`,
                    background: done ? mc.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: '#000', flexShrink: 0,
                  }}>{done ? '✓' : ''}</div>
                  <div style={{ fontSize: 16 }}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: done ? mc.accent : '#e7e5e4' }}>{h.label}</div>
                    <div style={{ fontSize: 9, color: '#292524', marginTop: 1 }}>{h.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <PrimaryBtn onClick={advanceDay} style={{ marginTop: 12, width: '100%' }}>
            NEXT DAY
          </PrimaryBtn>
        </div>

        <div style={{ fontSize: 9, color: '#292524', textAlign: 'center', letterSpacing: '0.08em', lineHeight: 1.8 }}>
          Goal creation and system changes are disabled. Execute the five above. That is enough.
        </div>
      </div>
    )
  }

  // ── Normal view ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Collapse risk banner */}
      {collapseRisk.score > 0 && collapseRisk.phase !== 'stable' && (
        <div style={{
          background: isWatch ? 'rgba(251,146,60,0.04)' : 'rgba(120,113,108,0.04)',
          border: `1px solid ${isWatch ? 'rgba(251,146,60,0.2)' : 'rgba(120,113,108,0.15)'}`,
          borderRadius: 8,
          padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: isWatch ? '#fb923c' : '#78716c', letterSpacing: '0.15em' }}>
              COLLAPSE RISK — {collapseRisk.score} — {collapseRisk.phase.toUpperCase()}
            </div>
            {(isWatch || isDrift) && state.awarenessAcknowledged !== today && (
              <button
                onClick={acknowledgeAwareness}
                style={{
                  padding: '3px 8px', background: 'transparent',
                  border: '1px solid rgba(120,113,108,0.3)', borderRadius: 4,
                  color: '#78716c', fontSize: 8, cursor: 'pointer', letterSpacing: '0.1em',
                }}
              >
                I SEE IT
              </button>
            )}
          </div>
          {collapseRisk.signals.slice(0, 2).map((sig, i) => (
            <div key={i} style={{ fontSize: 10, color: '#44403c', lineHeight: 1.6, marginBottom: 2 }}>{sig}</div>
          ))}
          {patternMatch && (
            <div style={{
              fontSize: 9, color: '#44403c', marginTop: 6,
              borderLeft: '2px solid rgba(120,113,108,0.2)', paddingLeft: 8, lineHeight: 1.6,
            }}>
              Pattern resembles destabilization sequence from {patternMatch.date}.
            </div>
          )}
        </div>
      )}

      {/* Contract divergences */}
      {contractDivergences.length > 0 && (
        <div
          onClick={() => setModal('contracts')}
          style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.15em', marginBottom: 4 }}>
            CONTRACT DIVERGENCE — {contractDivergences.length} PATTERN{contractDivergences.length > 1 ? 'S' : ''}
          </div>
          <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.6 }}>
            {contractDivergences[0].note}
          </div>
        </div>
      )}

      {/* Psych bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <PsychBar label="MOMENTUM"      value={momentum}     color={momentumColor} />
        <PsychBar label="DRIFT"         value={drift}        color={driftColor}    invert />
        <PsychBar label="RESISTANCE"    value={resistance}   color={resistColor}   invert />
        <PsychBar label="SELF-BETRAYAL" value={selfBetrayal} color={betrayColor}   invert />
      </div>

      {/* Level bar */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>
            {level.name}{nextLevel && <span style={{ color: '#292524' }}> → {nextLevel.name}</span>}
          </span>
          <span style={{ fontSize: 10, color: '#44403c' }}>{state.totalXP.toLocaleString()} XP</span>
        </div>
        <Bar pct={levelPct} color={level.color} />
      </div>

      {/* Directives */}
      <div style={{
        background: mc.cardBg,
        border: `1px solid ${allDoneToday ? mc.accent + '33' : mc.border}`,
        borderRadius: 10, padding: 14,
        transition: 'border-color 0.3s',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>DIRECTIVES — WEEK {week}</span>
          <span style={{ fontSize: 11, color: allDoneToday ? mc.accent : '#44403c' }}>
            {doneToday}/{state.habits.length}{allDoneToday ? ' ✦' : ''}
          </span>
        </div>

        {allDoneToday && (
          <div style={{
            background: mc.accent + '11', border: `1px solid ${mc.accent}33`,
            borderRadius: 6, padding: '8px 10px',
            fontSize: 10, color: mc.accent, letterSpacing: '0.08em', marginBottom: 10,
          }}>
            ALL DIRECTIVES COMPLETE
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {state.habits.map(h => {
            const done = !!checks[h.id]
            const isOpen = openComment === h.id
            return (
              <div key={h.id} style={{
                display: 'flex', flexDirection: 'column',
                padding: '9px 10px', borderRadius: 7,
                border: `1px solid ${done ? mc.accent + '22' : mc.border}`,
                background: done ? mc.accent + '06' : mc.bg,
                borderLeft: `2px solid ${done ? mc.accent : 'transparent'}`,
                transition: 'all 0.2s', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }} onClick={() => toggleHabit(h.id)}>
                  <div style={{
                    width: 17, height: 17, borderRadius: 3, marginTop: 1, flexShrink: 0,
                    border: `1px solid ${done ? mc.accent : '#292524'}`,
                    background: done ? mc.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#000', fontWeight: 'bold',
                  }}>
                    {done ? '✓' : ''}
                  </div>
                  <div style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>{h.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: done ? mc.accent : '#e7e5e4' }}>
                      {h.label}
                    </div>
                    <div style={{ fontSize: 9, color: '#292524', marginTop: 1, lineHeight: 1.5 }}>
                      {h.desc}
                    </div>
                    {!done && (
                      <div style={{ fontSize: 9, color: '#7f1d1d', marginTop: 3, opacity: 0.7 }}>
                        skip = -{h.xp} XP
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 14, flexShrink: 0, marginTop: 1,
                    color: done ? mc.accent : '#1f1f1d',
                  }}>
                    +{h.xp}
                  </div>
                </div>

                {/* Comment section */}
                <div style={{ paddingLeft: 36, marginTop: 5 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setOpenComment(isOpen ? null : h.id) }}
                    style={{
                      background: 'none', border: 'none', color: '#292524',
                      fontSize: 9, cursor: 'pointer', letterSpacing: '0.06em', padding: 0,
                    }}
                  >
                    {comments[h.id] ? (isOpen ? 'close' : 'note *') : (isOpen ? 'close' : 'add note')}
                  </button>
                  {isOpen && (
                    <textarea
                      value={comments[h.id] || ''}
                      onChange={e => saveComment(h.id, e.target.value)}
                      onClick={e => e.stopPropagation()}
                      placeholder="Be honest. The mirror only works if you stop performing for it."
                      rows={3}
                      style={{
                        width: '100%', marginTop: 5, padding: '8px 10px',
                        background: mc.bg, border: `1px solid ${mc.border}`,
                        borderRadius: 5, color: '#78716c',
                        fontSize: 10, outline: 'none', resize: 'none', lineHeight: 1.6,
                      }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <PrimaryBtn onClick={advanceDay}>NEXT DAY</PrimaryBtn>
          <GhostBtn onClick={() => setModal('grace')}>MISSED DAY</GhostBtn>
        </div>
      </div>

      {/* JARVIS button */}
      <button
        onClick={() => runJarvis('daily check-in')}
        className="pulse-glow"
        style={{
          padding: 13, width: '100%',
          background: 'rgba(96,165,250,0.04)',
          border: '1px solid rgba(96,165,250,0.12)',
          borderRadius: 8, color: '#60a5fa',
          fontSize: 10, letterSpacing: '0.12em', cursor: 'pointer',
        }}
      >
        CALL JARVIS
      </button>

      {/* Missions */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>MISSIONS</span>
          <button onClick={() => setModal('mission')} style={{
            padding: '4px 8px', background: 'transparent', border: `1px solid ${mc.border}`,
            borderRadius: 4, color: '#44403c', fontSize: 9, cursor: 'pointer',
          }}>+ ADD</button>
        </div>
        {state.missions.length === 0 ? (
          <div style={{ fontSize: 11, color: '#292524', textAlign: 'center', padding: '10px 0' }}>
            No missions set. What are you working toward?
          </div>
        ) : state.missions.map(m => {
          const { daysUntil } = require('../../lib/storage')
          const d = daysUntil(m.date)
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0', borderBottom: `1px solid ${mc.border}`,
            }}>
              <div style={{ fontSize: 20 }}>{m.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: '#e7e5e4' }}>{m.name}</div>
                <div style={{ fontSize: 9, color: '#44403c', fontStyle: 'italic', marginTop: 1 }}>
                  "{m.why}"
                </div>
              </div>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20, color: d < 30 ? '#ef4444' : mc.accent,
              }}>
                {d < 0 ? 'PAST' : `${d}d`}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
