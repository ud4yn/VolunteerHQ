import { useMemo, useState } from 'react'
import { FillMeter, ShiftMeta, StatusBadge } from '../components/Chrome'
import { filledCount, isUnderstaffed, rankReplacements, requiredSkillsFor } from '../lib/matching'
import { useAppStore } from '../store/useAppStore'

export default function Replacement() {
  const store = useAppStore()
  const { state, focusShiftId, setFocusShiftId, simulateDropout, assignReplacement } = store
  const [localSelectedId, setLocalSelectedId] = useState(state.shifts[0]?.id || '')
  const selectedId = focusShiftId || localSelectedId

  const shift = state.shifts.find((item) => item.id === selectedId)
  const crew = shift
    ? state.assignments.filter((item) => item.shiftId === shift.id)
    : []
  const activeCrew = crew.filter((item) => item.status !== 'dropped')
  const ranked = useMemo(() => {
    if (!shift) return []
    return rankReplacements(shift, state.volunteers, state.assignments)
  }, [shift, state.volunteers, state.assignments])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Intelligence</p>
          <h1>Replacement engine</h1>
        </div>
      </header>

      <div className="toolbar">
        <select
          value={selectedId}
          onChange={(event) => {
            setLocalSelectedId(event.target.value)
            setFocusShiftId(event.target.value)
          }}
        >
          {state.shifts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
              {isUnderstaffed(item, state.assignments) ? ' · understaffed' : ''}
            </option>
          ))}
        </select>
      </div>

      {!shift ? (
        <p className="muted">Create a shift first.</p>
      ) : (
        <div className="split">
          <section className="panel">
            <div className="panel-head">
              <h2>{shift.title}</h2>
              <StatusBadge value={shift.status} />
            </div>
            <ShiftMeta shift={shift} />
            <FillMeter shift={shift} />
            <p className="muted">
              Needed skills: {requiredSkillsFor(shift.role).join(', ') || 'general'}
            </p>
            {isUnderstaffed(shift, state.assignments) ? (
              <div className="callout warn">
                Understaffed — {filledCount(state.assignments, shift.id)} of {shift.capacity} seats filled.
              </div>
            ) : (
              <div className="callout ok">This shift is at capacity. Dropout to free a seat.</div>
            )}

            <h3>Assigned crew</h3>
            <ul className="crew-list">
              {crew.map((item) => {
                const volunteer = store.volunteer(item.volunteerId)
                return (
                  <li key={item.id} className={item.status === 'dropped' ? 'dropped' : ''}>
                    <div>
                      <strong>{volunteer?.name}</strong>
                      <p className="muted">{volunteer?.skills.join(', ')}</p>
                    </div>
                    <StatusBadge value={item.status} />
                    {item.status !== 'dropped' ? (
                      <button
                        type="button"
                        className="btn danger-ghost"
                        onClick={async () => {
                          const id = await simulateDropout(item.id)
                          if (id) setLocalSelectedId(id)
                        }}
                      >
                        Simulate dropout
                      </button>
                    ) : null}
                  </li>
                )
              })}
              {activeCrew.length === 0 ? <li className="muted">Nobody is currently assigned.</li> : null}
            </ul>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Ranked replacements</h2>
            </div>
            <p className="muted pad-sm">
              Scored by matching skills, {shift ? 'availability for this window' : 'availability'}, and current load.
            </p>
            <ol className="rank-list">
              {ranked.slice(0, 8).map((row, index) => (
                <li key={row.volunteer.id}>
                  <div className="rank-index">{index + 1}</div>
                  <div className="rank-body">
                    <div className="rank-top">
                      <strong>{row.volunteer.name}</strong>
                      <span className="score">{row.score}</span>
                    </div>
                    <p className="muted">{row.reasons.join(' · ')}</p>
                    <div className="chip-row">
                      {row.volunteer.skills.map((skill) => (
                        <span
                          key={skill}
                          className={`chip ${row.matchedSkills.includes(skill) ? 'chip-on' : ''}`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={
                        filledCount(state.assignments, shift.id) >= shift.capacity ||
                        shift.status === 'cancelled' ||
                        shift.status === 'completed'
                      }
                      onClick={() => assignReplacement(shift.id, row.volunteer.id)}
                    >
                      Assign replacement
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  )
}
