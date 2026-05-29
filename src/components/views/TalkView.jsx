import { useState, useEffect, useRef } from 'react'
import { callJarvisChat, formatApiError } from '../../lib/api'
import { TALK_SYSTEM } from '../../constants/prompts'
import { todayStr } from '../../lib/storage'

function buildContext({ state, momentum, drift, resistance, selfBetrayal, collapseRisk, contractDivergences, mode }) {
  const hist = Object.entries(state.history)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 7)

  const habitLines = state.habits.map(h => {
    const done = hist.filter(([, d]) => d.checks?.[h.id]).length
    return `${h.label}: ${done}/${hist.length}`
  }).join(', ')

  const recentComments = hist
    .flatMap(([date, d]) =>
      Object.entries(d.comments || {})
        .filter(([, v]) => v)
        .map(([hid, c]) => {
          const h = state.habits.find(x => x.id === hid)
          return `${h?.label || '?'}: ${c}`
        })
    )
    .slice(-6)
    .join(' | ')

  const signals = collapseRisk.signals.join('; ') || 'none'
  const divStr = contractDivergences.map(d => `Contract ${d.contract}: ${d.note}`).join(' | ') || 'none'

  return `FORGE context: Mode=${mode.toUpperCase()} CollapseRisk=${collapseRisk.score}(${collapseRisk.phase}) Momentum=${momentum} Drift=${drift} Resistance=${resistance} SelfBetrayal=${selfBetrayal} Day=${state.dayCount} Streak=${state.streak} Habits(7d)=[${habitLines}] Signals=[${signals}] ContractDivergences=[${divStr}] RecentNotes=[${recentComments}]`
}

export function TalkView({ state, mc, momentum, drift, resistance, selfBetrayal, collapseRisk, contractDivergences, mode }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    text: 'I have your data. What is going on.',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMsg = { role: 'user', text, time: now }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setLoading(true)

    // Build API message history
    const context = buildContext({ state, momentum, drift, resistance, selfBetrayal, collapseRisk, contractDivergences, mode })
    const apiMessages = newMessages
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map((m, i) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: i === 0 ? `${context} | User says: ${m.text}` : m.text,
      }))

    try {
      const reply = await callJarvisChat(TALK_SYSTEM, apiMessages)
      setMessages(m => [...m, {
        role: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    } catch (err) {
      setMessages(m => [...m, {
        role: 'assistant',
        text: formatApiError(err),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }])
    }
    setLoading(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 400 }}>
      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: 12, paddingBottom: 12, minHeight: 0,
      }}>
        {messages.map((m, i) => {
          const isJ = m.role === 'assistant'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isJ ? 'flex-start' : 'flex-end' }}>
              {isJ && (
                <div style={{ fontSize: 8, color: '#60a5fa', letterSpacing: '0.15em', marginBottom: 4, marginLeft: 2 }}>
                  JARVIS · {m.time}
                </div>
              )}
              <div style={{
                maxWidth: '85%', padding: '10px 14px',
                borderRadius: isJ ? '2px 10px 10px 10px' : '10px 2px 10px 10px',
                background: isJ ? 'rgba(96,165,250,0.06)' : mc.accent + '11',
                border: `1px solid ${isJ ? 'rgba(96,165,250,0.15)' : mc.accent + '33'}`,
                fontSize: 12, color: isJ ? '#93c5fd' : mc.accent,
                lineHeight: 1.8, whiteSpace: 'pre-wrap',
                fontFamily: "'DM Mono', monospace",
              }}>
                {m.text}
                {isJ && i === messages.length - 1 && !loading && (
                  <span style={{ animation: 'blink 1s step-end infinite' }}>|</span>
                )}
              </div>
              {!isJ && (
                <div style={{ fontSize: 8, color: '#44403c', letterSpacing: '0.1em', marginTop: 4, marginRight: 2 }}>
                  {m.time}
                </div>
              )}
            </div>
          )
        })}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 8, color: '#60a5fa', letterSpacing: '0.15em', marginBottom: 4, marginLeft: 2 }}>JARVIS</div>
            <div style={{
              padding: '10px 14px', borderRadius: '2px 10px 10px 10px',
              background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
            }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#3b82f6', display: 'inline-block',
                    animation: `dotPulse 1s ease ${i * 0.2}s infinite`,
                  }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ paddingTop: 10, borderTop: `1px solid ${mc.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Talk to JARVIS..."
            rows={3}
            style={{
              flex: 1, padding: '10px 12px',
              background: mc.cardBg, border: `1px solid ${mc.border}`,
              borderRadius: 8, color: '#d6d3d1',
              fontSize: 12, outline: 'none', resize: 'none', lineHeight: 1.6, minHeight: 60,
            }}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            style={{
              padding: '14px 16px',
              background: mc.accent + '11', border: `1px solid ${mc.accent}33`,
              borderRadius: 8, color: mc.accent,
              fontSize: 11, cursor: 'pointer', letterSpacing: '0.1em',
              opacity: (loading || !input.trim()) ? 0.4 : 1,
              alignSelf: 'stretch',
            }}
          >
            SEND
          </button>
        </div>
        <div style={{ fontSize: 8, color: '#292524', marginTop: 5, letterSpacing: '0.08em' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
