import { useState } from 'react'
import { PsychBar } from '../ui/Bar'
import { INTEGRITY_CONTRACTS } from '../../constants/contracts'

export function IntelView({
  state, mc, momentum, drift, resistance, selfBetrayal,
  collapseRisk, contractDivergences, patternMatch,
  mode, runJarvis, jarvisLoading,
}) {
  const hist = Object.values(state.history)
  const perfect = hist.filter(d => state.habits.every(h => d.checks?.[h.id])).length

  const momentumColor = momentum > 60 ? '#10b981' : momentum > 35 ? mc.accent : '#ef4444'
  const driftColor    = drift > 60 ? '#ef4444' : drift > 30 ? mc.accent : '#10b981'
  const resistColor   = resistance > 60 ? '#ef4444' : resistance > 30 ? mc.accent : '#10b981'
  const betrayColor   = selfBetrayal > 60 ? '#ef4444' : selfBetrayal > 30 ? mc.accent : '#10b981'
  const riskColor     = collapseRisk.score > 54 ? '#ef4444' : collapseRisk.score > 34 ? '#fb923c' : '#10b981'

  const TRIGGERS = [
    ['Weekly Review',   'weekly review'],
    ['Pattern Scan',    'deep pattern analysis including comment language'],
    ['Trajectory',      'behavioral trend projection — where does current trajectory lead in 30 days'],
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Psychological state */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 12 }}>
          PSYCHOLOGICAL STATE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <PsychBar label="MOMENTUM"      value={momentum}     color={momentumColor} />
          <PsychBar label="DRIFT"         value={drift}        color={driftColor}    invert />
          <PsychBar label="RESISTANCE"    value={resistance}   color={resistColor}   invert />
          <PsychBar label="SELF-BETRAYAL" value={selfBetrayal} color={betrayColor}   invert />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: mc.bg, borderRadius: 6, border: `1px solid ${mc.border}` }}>
            <span style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.1em' }}>INFERRED MODE</span>
            <span style={{ fontSize: 9, color: mc.accent, letterSpacing: '0.15em', fontWeight: 'bold' }}>{mode.toUpperCase()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: mc.bg, borderRadius: 6, border: `1px solid ${mc.border}` }}>
            <span style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.1em' }}>COLLAPSE RISK</span>
            <span style={{ fontSize: 9, color: riskColor, letterSpacing: '0.15em' }}>
              {collapseRisk.score} / {collapseRisk.phase.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Contract divergences */}
      {contractDivergences.length > 0 && (
        <div style={{ background: mc.cardBg, border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#ef4444', marginBottom: 10 }}>
            INTEGRITY CONTRACT DIVERGENCES
          </div>
          {contractDivergences.map(d => {
            const contract = INTEGRITY_CONTRACTS.find(c => c.id === d.contract)
            return (
              <div key={d.contract} style={{ padding: '10px 0', borderBottom: `1px solid ${mc.border}` }}>
                <div style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.1em', marginBottom: 4 }}>
                  CONTRACT {d.contract}: {contract?.short.toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.6 }}>{d.note}</div>
                {contract && (
                  <div style={{ fontSize: 10, color: '#44403c', marginTop: 6, lineHeight: 1.6, borderLeft: '2px solid rgba(239,68,68,0.2)', paddingLeft: 8 }}>
                    {contract.full}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pattern match */}
      {patternMatch && (
        <div style={{ background: mc.cardBg, border: '1px solid rgba(120,113,108,0.2)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#78716c', marginBottom: 8 }}>PATTERN MEMORY</div>
          <div style={{ fontSize: 11, color: '#57534e', lineHeight: 1.7 }}>
            Current signal cluster matches a pattern observed on {patternMatch.date} (risk score {patternMatch.score}).
            Previous signals: {patternMatch.signals.join('; ')}.
          </div>
        </div>
      )}

      {/* Behavioral data */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 12 }}>BEHAVIORAL DATA</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['DAYS LOGGED', hist.length],
            ['PERFECT DAYS', perfect],
            ['BEST STREAK', `${state.longestStreak}d`],
            ['GRACE USED', `${state.graceDaysUsed}/5`],
          ].map(([label, val]) => (
            <div key={label} style={{ background: mc.bg, border: `1px solid ${mc.border}`, borderRadius: 7, padding: 10, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#e7e5e4' }}>{val}</div>
              <div style={{ fontSize: 8, color: '#44403c', letterSpacing: '0.12em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* JARVIS triggers */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 10 }}>CALL JARVIS</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {TRIGGERS.map(([label, trigger]) => (
            <button
              key={label}
              onClick={() => runJarvis(trigger)}
              disabled={jarvisLoading}
              style={{
                padding: '8px 12px',
                background: 'rgba(96,165,250,0.04)',
                border: '1px solid rgba(96,165,250,0.12)',
                borderRadius: 6, color: '#60a5fa',
                fontSize: 9, letterSpacing: '0.08em',
                cursor: jarvisLoading ? 'default' : 'pointer',
                opacity: jarvisLoading ? 0.5 : 1,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {state.jarvisInsights.length === 0 ? (
          <div style={{ fontSize: 11, color: '#292524', textAlign: 'center', padding: '10px 0' }}>
            No analyses yet.
          </div>
        ) : state.jarvisInsights.map((ins, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: `1px solid ${mc.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 8, color: mc.accent, letterSpacing: '0.12em' }}>
                {ins.trigger.toUpperCase()}
              </div>
              <div style={{ fontSize: 8, color: '#292524' }}>
                {ins.date}{ins.mode ? ` · ${ins.mode.toUpperCase()}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.8 }}>{ins.msg}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
