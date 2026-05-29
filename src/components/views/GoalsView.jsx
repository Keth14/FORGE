import { useState } from 'react'
import { callJarvis, formatApiError } from '../../lib/api'
import { GOAL_SYSTEM, FOCUS_SYSTEM } from '../../constants/prompts'
import { todayStr } from '../../lib/storage'

function GoalItems({ items, checks, onToggle, mc }) {
  const grouped = items.reduce((acc, item) => {
    ;(acc[item.category] = acc[item.category] || []).push(item)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Object.entries(grouped).map(([cat, its]) => (
        <div key={cat}>
          <div style={{ fontSize: 8, color: '#44403c', letterSpacing: '0.2em', marginBottom: 6, paddingBottom: 4, borderBottom: `1px solid ${mc.border}` }}>
            {cat.toUpperCase()}
          </div>
          {its.map(item => {
            const done = !!checks[item.id]
            return (
              <div key={item.id} onClick={() => onToggle(item.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: `1px solid ${mc.border}`, cursor: 'pointer', opacity: done ? 0.4 : 1 }}>
                <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${done ? mc.accent : '#292524'}`, background: done ? mc.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#000', flexShrink: 0, marginTop: 1 }}>
                  {done ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: done ? '#78716c' : '#d6d3d1', textDecoration: done ? 'line-through' : 'none', lineHeight: 1.5 }}>{item.task}</div>
                  <div style={{ fontSize: 9, color: '#44403c', marginTop: 2, fontStyle: 'italic' }}>{item.note}</div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function GoalsView({ state, mc, toggleGoalItem, updateGoal, removeGoal, setModal, collapseRisk }) {
  const [activeGoal, setActiveGoal] = useState(null)
  const [tab, setTab] = useState('plan')
  const [loadingFocus, setLoadingFocus] = useState(null)
  const isStabilization = collapseRisk?.phase === 'stabilization'

  async function refreshFocus(goal) {
    setLoadingFocus(goal.id)
    const done = Object.entries(goal.checks || {})
      .filter(([, v]) => v)
      .map(([k]) => goal.plan?.find(p => p.id === k)?.task || k)
    try {
      const raw = await callJarvis(
        FOCUS_SYSTEM,
        `Goal: ${goal.name}\nPlan: ${JSON.stringify(goal.plan)}\nCompleted: ${done.join(', ') || 'None'}\nGenerate today adjusted focus max 7 items.`
      )
      const focus = JSON.parse(raw.replace(/```json|```/g, '').trim())
      updateGoal(goal.id, { dailyFocus: focus, dailyFocusDate: todayStr(), dailyFocusLoading: false })
    } catch (err) {
      console.error(formatApiError(err))
    }
    setLoadingFocus(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: '#44403c' }}>AI GOAL EXPANDER</span>
        {!isStabilization ? (
          <button onClick={() => setModal('goal')} style={{ padding: '8px 14px', background: mc.accent + '11', border: `1px solid ${mc.accent}33`, borderRadius: 6, color: mc.accent, fontSize: 10, letterSpacing: '0.1em', cursor: 'pointer' }}>
            + NEW GOAL
          </button>
        ) : (
          <span style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.08em' }}>disabled in stabilization</span>
        )}
      </div>

      {state.goals.length === 0 && (
        <div style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: '20px 14px', textAlign: 'center', fontSize: 11, color: '#292524' }}>
          No goals. Add one and JARVIS builds the plan.
        </div>
      )}

      {state.goals.map(g => {
        const doneCount = Object.values(g.checks || {}).filter(Boolean).length
        const totalCount = (g.plan || []).length
        const isActive = activeGoal === g.id
        const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

        return (
          <div key={g.id} style={{ background: mc.cardBg, border: `1px solid ${mc.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setActiveGoal(isActive ? null : g.id)}>
              <div>
                <div style={{ fontSize: 13, color: '#e7e5e4', fontWeight: 500 }}>{g.name}</div>
                <div style={{ fontSize: 9, color: '#44403c', marginTop: 2 }}>{g.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 10, color: pct >= 70 ? '#10b981' : mc.accent }}>{doneCount}/{totalCount}</div>
                <div style={{ fontSize: 11, color: '#44403c' }}>{isActive ? '▲' : '▼'}</div>
              </div>
            </div>

            {!g.planLoading && totalCount > 0 && (
              <div style={{ marginTop: 8, height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct >= 70 ? '#10b981' : mc.accent, borderRadius: 99, transition: 'width 0.5s' }} />
              </div>
            )}

            {isActive && (
              <div style={{ marginTop: 14 }}>
                {g.planLoading ? (
                  <div style={{ color: '#44403c', fontSize: 12, padding: '10px 0' }}>Generating plan...</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                      {[['plan', 'FULL PLAN'], ['today', 'TODAY']].map(([t, lb]) => (
                        <button key={t} onClick={() => setTab(t)} style={{ padding: '5px 10px', background: tab === t ? mc.accent + '11' : 'transparent', border: `1px solid ${tab === t ? mc.accent + '33' : mc.border}`, borderRadius: 5, color: tab === t ? mc.accent : '#44403c', fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em' }}>
                          {lb}
                        </button>
                      ))}
                      <button onClick={() => refreshFocus(g)} disabled={loadingFocus === g.id} style={{ padding: '5px 10px', background: 'transparent', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 5, color: '#60a5fa', fontSize: 9, cursor: 'pointer', marginLeft: 'auto' }}>
                        {loadingFocus === g.id ? '...' : 'REFRESH'}
                      </button>
                    </div>

                    {tab === 'plan' && <GoalItems items={g.plan || []} checks={g.checks || {}} onToggle={id => toggleGoalItem(g.id, id)} mc={mc} />}
                    {tab === 'today' && (
                      g.dailyFocus
                        ? <GoalItems items={g.dailyFocus} checks={g.checks || {}} onToggle={id => toggleGoalItem(g.id, id)} mc={mc} />
                        : <div style={{ fontSize: 11, color: '#292524', padding: '8px 0' }}>Hit REFRESH for today adjusted focus.</div>
                    )}
                  </>
                )}
                <button onClick={() => removeGoal(g.id)} style={{ marginTop: 12, width: '100%', padding: 9, background: 'transparent', border: '1px solid #7f1d1d', borderRadius: 7, color: '#f87171', fontSize: 9, cursor: 'pointer', letterSpacing: '0.1em' }}>
                  REMOVE GOAL
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
