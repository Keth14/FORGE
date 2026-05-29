import { calcAvatarStats, getTierLabel, getTierColor } from '../../lib/signals'
import { Bar } from '../ui/Bar'

// ── Abstract Identity SVG ─────────────────────────────────────────────────────
// No face. Pure atmospheric state visualization.
// Silhouette, lighting, grain, posture, environmental distortion.
function IdentitySVG({ stats, mode, mc, driftVal }) {
  const d = stats.discipline / 100
  const p = stats.physical / 100
  const cl = stats.clarity / 100
  const conf = stats.confidence / 100
  const integ = stats.integrity / 100
  const drift = driftVal / 100

  const isWar        = mode === 'war'
  const isDrift      = mode === 'drift'
  const isStabilize  = mode === 'stabilization'
  const isRecovery   = mode === 'recovery'

  // Core visual derivations
  const glowCol      = isWar ? '#ef4444' : isStabilize ? '#60a5fa' : isDrift ? '#44403c' : isRecovery ? '#60a5fa' : mc.accent
  const glowIntensity = isWar ? 0.18 : isDrift ? 0.04 : isStabilize ? 0.12 : conf * 0.15 + 0.04

  const upright      = d * 0.5 + p * 0.3 + integ * 0.2
  const fragmentation = isDrift ? 0.7 : isStabilize ? 0.85 : (1 - integ) * 0.4 + (1 - d) * 0.3
  const breathAmp    = isWar ? 1 : isRecovery ? 3 : isDrift ? 5 : 2
  const eyeOpacity   = isWar ? 0.95 : isDrift ? 0.3 : isRecovery ? 0.25 : cl * 0.7 + 0.2
  const eyeSize      = isWar ? 2.5 : isDrift ? 1.2 : cl * 1.5 + 1

  // Silhouette geometry
  const cx          = 150
  const shoulderW   = Math.round(80 + upright * 20)
  const neckH       = Math.round(30 + upright * 10)
  const headR       = 42
  const shoulderY   = 30 + headR * 2 + neckH
  const bodyBottom  = 320
  const eyeY        = shoulderY - neckH - headR * 0.1

  const silPath = `M ${cx - shoulderW} ${bodyBottom} Q ${cx - shoulderW - 10} ${shoulderY + 40} ${cx - shoulderW + 8} ${shoulderY} L ${cx - 12} ${shoulderY - neckH} A ${headR} ${headR} 0 0 1 ${cx + 12} ${shoulderY - neckH} L ${cx + shoulderW - 8} ${shoulderY} Q ${cx + shoulderW + 10} ${shoulderY + 40} ${cx + shoulderW} ${bodyBottom} Z`

  // Fragmentation lines
  const fragLines = []
  if (fragmentation > 0.4) {
    const numLines = Math.round(fragmentation * 8)
    for (let i = 0; i < numLines; i++) {
      const fy = shoulderY - 20 + i * (bodyBottom - shoulderY + 20) / numLines
      const offset = Math.sin(i * 2.3) * 20 * fragmentation
      fragLines.push({ y: fy, offset, opacity: fragmentation * 0.25, delay: i * 0.2 })
    }
  }

  const bgDepth = isWar ? '#0d0808' : isDrift ? '#0c0c0b' : isStabilize ? '#08090e' : isRecovery ? '#080d0f' : '#0a0908'

  return (
    <svg
      viewBox="0 0 300 340"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', maxWidth: 240, margin: '0 auto', display: 'block' }}
    >
      <defs>
        <radialGradient id="ambientGlow" cx="50%" cy="35%" r="55%">
          <stop offset="0%"   stopColor={glowCol} stopOpacity={glowIntensity} />
          <stop offset="100%" stopColor={bgDepth} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="silGrad" cx="35%" cy="25%" r="70%">
          <stop offset="0%"   stopColor={isWar ? '#2a1a1a' : isDrift ? '#181816' : '#1a1612'} stopOpacity="1" />
          <stop offset="60%"  stopColor={isWar ? '#0f0808' : '#0c0a08'} stopOpacity="1" />
          <stop offset="100%" stopColor="#050403" stopOpacity="1" />
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency={isDrift ? '0.85' : '0.65'} numOctaves="4" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="edgeBlur">
          <feGaussianBlur stdDeviation={isDrift ? '3' : isStabilize ? '2' : '0.5'} />
        </filter>
        <filter id="sharpGlow">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <clipPath id="silClip"><path d={silPath} /></clipPath>
        <style>{`
          @keyframes breathe-svg {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(${breathAmp}px); }
          }
          @keyframes eyePulse-svg {
            0%, 100% { opacity: ${eyeOpacity}; }
            50% { opacity: ${eyeOpacity * 0.5}; }
          }
          @keyframes fragDrift-svg {
            0% { transform: translateX(0); }
            50% { transform: translateX(3px); }
            100% { transform: translateX(0); }
          }
        `}</style>
      </defs>

      {/* Background */}
      <rect width="300" height="340" fill={bgDepth} />
      <ellipse cx="150" cy="160" rx="130" ry="150" fill="url(#ambientGlow)" />

      {/* Ground glow */}
      <ellipse cx={cx} cy={bodyBottom + 5} rx={shoulderW * 0.7} ry="6" fill={glowCol} opacity={glowIntensity * 0.5} />

      {/* Breathing silhouette group */}
      <g style={{
        animation: `breathe-svg ${isWar ? '3s' : isDrift ? '6s' : '4s'} ease-in-out infinite`,
        transformOrigin: '150px 170px',
      }}>
        {/* Silhouette */}
        <path d={silPath} fill="url(#silGrad)" filter={isDrift || isStabilize ? 'url(#edgeBlur)' : 'none'} />

        {/* Inner chest glow */}
        <ellipse
          cx={cx} cy={shoulderY + 40} rx="25" ry="35"
          fill={glowCol}
          opacity={isWar ? 0.08 : isDrift ? 0.02 : 0.05}
          clipPath="url(#silClip)"
        />

        {/* Grain texture */}
        <path d={silPath} fill="transparent" filter="url(#grain)" opacity={isDrift ? 0.4 : 0.25} />

        {/* Eye glints */}
        <g style={{ animation: `eyePulse-svg ${isWar ? '2s' : isDrift ? '5s' : '3s'} ease-in-out infinite` }}>
          <ellipse cx={cx - 13} cy={eyeY} rx={eyeSize * 2.5} ry={eyeSize}
            fill={glowCol} opacity={eyeOpacity} filter="url(#sharpGlow)" />
          <ellipse cx={cx + 13} cy={eyeY} rx={eyeSize * 2.5} ry={eyeSize}
            fill={glowCol} opacity={eyeOpacity} filter="url(#sharpGlow)" />
          <ellipse cx={cx - 13} cy={eyeY} rx={eyeSize * 0.6} ry={eyeSize * 0.6}
            fill="#fff" opacity={eyeOpacity * 0.4} />
          <ellipse cx={cx + 13} cy={eyeY} rx={eyeSize * 0.6} ry={eyeSize * 0.6}
            fill="#fff" opacity={eyeOpacity * 0.4} />
        </g>

        {/* Fragmentation lines */}
        {fragLines.map((fl, i) => (
          <line key={i}
            x1={cx - shoulderW + fl.offset} y1={fl.y}
            x2={cx + shoulderW + fl.offset} y2={fl.y}
            stroke={glowCol} strokeWidth="0.5" opacity={fl.opacity}
            style={{
              animation: `fragDrift-svg ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${fl.delay}s`,
            }}
          />
        ))}

        {/* War mode — sharp edge markers */}
        {isWar && (
          <g opacity="0.15">
            <line x1={cx - shoulderW} y1={shoulderY} x2={cx - shoulderW + 8} y2={shoulderY} stroke={glowCol} strokeWidth="1.5" />
            <line x1={cx + shoulderW - 8} y1={shoulderY} x2={cx + shoulderW} y2={shoulderY} stroke={glowCol} strokeWidth="1.5" />
          </g>
        )}
      </g>

      {/* Floor reflection */}
      <g opacity="0.1" transform={`scale(1,-0.12) translate(0,${-(bodyBottom * 2 + 20)})`}>
        <path d={silPath} fill={glowCol} />
      </g>

      {/* War border */}
      {isWar && <rect x="0" y="0" width="300" height="340" fill="transparent" stroke={glowCol} strokeWidth="0.5" opacity="0.08" />}
    </svg>
  )
}

// ── Avatar View ───────────────────────────────────────────────────────────────
export function YouView({ state, mc, momentum, drift, resistance, selfBetrayal, collapseRisk, mode }) {
  const stats = calcAvatarStats(state, momentum, drift, resistance, selfBetrayal, collapseRisk)

  const statDefs = [
    { key: 'discipline', label: 'DISCIPLINE', desc: 'Execution reliability',   color: '#f59e0b' },
    { key: 'physical',   label: 'PHYSICAL',   desc: 'Train · Sleep · Water',   color: '#10b981' },
    { key: 'clarity',    label: 'CLARITY',    desc: 'Focus · Low drift',       color: '#60a5fa' },
    { key: 'presence',   label: 'PRESENCE',   desc: 'Appearance · Connection', color: '#8b5cf6' },
    { key: 'integrity',  label: 'INTEGRITY',  desc: 'Promises kept',           color: '#ef4444' },
    { key: 'confidence', label: 'CONFIDENCE', desc: 'Composite signal',        color: mc.accent },
  ]

  function getStateLabel() {
    if (mode === 'war')          return 'Locked in.'
    if (mode === 'stabilization') return 'Stabilizing.'
    if (mode === 'drift')         return 'Drifting.'
    if (mode === 'delusion')      return 'Detached.'
    if (mode === 'recovery')      return 'Recovering.'
    const avg = (stats.discipline + stats.physical + stats.clarity) / 3
    if (avg > 70) return 'Building.'
    if (avg > 45) return 'Holding.'
    return 'Slipping.'
  }

  function getReading() {
    const parts = []
    if (stats.discipline < 35) parts.push('Execution is collapsing. The gap between intention and action is widening.')
    if (stats.physical < 35)   parts.push('Physical grounding is weak. Everything else destabilizes when this drops.')
    if (stats.clarity < 35)    parts.push('High drift. The mind is running but not in one direction.')
    if (stats.integrity < 40)  parts.push('Self-betrayal patterns active. Promises made, not kept.')
    if (stats.confidence > 70 && stats.discipline > 65) parts.push('Behavioral alignment is strong. This is the version you are building toward.')
    if (mode === 'war')          parts.push('War mode confirmed by data. Protect this state.')
    if (mode === 'drift')        parts.push('Drift is not failure. It is the beginning of one if unaddressed.')
    if (mode === 'stabilization') parts.push('Stabilization required. Execute the five basics. Nothing else.')
    if (mode === 'stable' && stats.discipline >= 50 && stats.physical >= 50) parts.push('Holding steady. Keep compounding.')
    if (parts.length === 0) parts.push('System is observing. Keep adding data.')
    return parts.join(' ')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Avatar card */}
      <div style={{
        background: mc.cardBg, border: `1px solid ${mc.border}`,
        borderRadius: 12, padding: '16px 14px 14px',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${mc.accent}, transparent)`,
          opacity: 0.4,
        }} />
        <IdentitySVG stats={stats} mode={mode} mc={mc} driftVal={drift} />
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: '0.25em', color: '#e7e5e4' }}>
            KETH
          </div>
          <div style={{ fontSize: 9, color: mc.accent, letterSpacing: '0.2em', marginTop: 2, opacity: 0.8 }}>
            {getStateLabel().toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 12, padding: 14 }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c', marginBottom: 14 }}>
          BEHAVIORAL ARCHITECTURE
        </div>
        {statDefs.map(stat => {
          const val = stats[stat.key]
          const tier = getTierLabel(val)
          const tierCol = getTierColor(val)
          return (
            <div key={stat.key} style={{ marginBottom: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 9, color: '#78716c', letterSpacing: '0.15em' }}>{stat.label}</span>
                  <span style={{ fontSize: 8, color: '#292524', letterSpacing: '0.06em' }}>{stat.desc}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 8, color: tierCol, letterSpacing: '0.1em' }}>{tier}</span>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: stat.color, opacity: 0.9 }}>
                    {val}
                  </span>
                </div>
              </div>
              <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${val}%`,
                  background: `linear-gradient(90deg, ${stat.color}55, ${stat.color})`,
                  borderRadius: 99, transition: 'width 1.2s ease',
                  boxShadow: `0 0 4px ${stat.color}33`,
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Reading */}
      <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: '12px 14px' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: '#292524', marginBottom: 8 }}>SYSTEM READING</div>
        <div style={{ fontSize: 11, color: '#57534e', lineHeight: 1.9, fontStyle: 'italic' }}>
          {getReading()}
        </div>
      </div>
    </div>
  )
}
