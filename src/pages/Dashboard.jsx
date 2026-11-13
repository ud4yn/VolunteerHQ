import { ActivityItem, FillMeter, StatusBadge } from '../components/Chrome'
import { filledCount, isUnderstaffed } from '../lib/matching'
import { formatDate, formatTime } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

export default function Dashboard({ onNavigate }) {
  const { state, metrics, understaffedShifts, setFocusShiftId } = useAppStore()
  const upcoming = [...state.shifts]
    .filter((shift) => shift.status !== 'cancelled')
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .slice(0, 6)

  const cards = [
    { label: 'Total volunteers', value: metrics.totalVolunteers, hint: `${metrics.activeVolunteers} active` },
    { label: 'Active shifts', value: metrics.activeShifts, hint: 'scheduled + live' },
    { label: 'Filled positions', value: metrics.filledPositions, hint: `${metrics.fillPct}% of capacity` },
    { label: 'Understaffed', value: metrics.understaffedCount, hint: 'needs coverage', warn: metrics.understaffedCount > 0 },
    { label: 'Attendance', value: `${metrics.attendancePct}%`, hint: `${metrics.checkedIn} checked in` },
  ]

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Helix Summit 2026</p>
          <h1>Operations pulse</h1>
        </div>
        <button type="button" className="btn primary" onClick={() => onNavigate('shifts')}>
          New coverage
        </button>
      </header>

      <section className="stat-grid">
        {cards.map((card) => (
          <article key={card.label} className={`stat-card ${card.warn ? 'warn' : ''}`}>
            <p>{card.label}</p>
            <strong>{card.value}</strong>
            <span>{card.hint}</span>
          </article>
        ))}
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head">
            <h2>Shift overview</h2>
            <button type="button" className="link" onClick={() => onNavigate('shifts')}>
              Manage
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>When</th>
                  <th>Fill</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((shift) => (
                  <tr key={shift.id}>
                    <td>
                      <strong>{shift.title}</strong>
                      <div className="muted">{shift.role} · {shift.location}</div>
                    </td>
                    <td>
                      {formatDate(shift.date)}
                      <div className="muted">
                        {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
                      </div>
                    </td>
                    <td>
                      <FillMeter shift={shift} />
                    </td>
                    <td>
                      <StatusBadge value={shift.status} />
                      {isUnderstaffed(shift, state.assignments) ? (
                        <span className="badge badge-understaffed">understaffed</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="stack">
          <section className="panel">
            <div className="panel-head">
              <h2>Alerts</h2>
            </div>
            {understaffedShifts.length === 0 ? (
              <p className="muted pad">All live shifts are covered.</p>
            ) : (
              <ul className="alert-list">
                {understaffedShifts.map((shift) => (
                  <li key={shift.id}>
                    <div>
                      <strong>{shift.title}</strong>
                      <p className="muted">
                        {filledCount(state.assignments, shift.id)}/{shift.capacity} filled · {shift.role}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => {
                        setFocusShiftId(shift.id)
                        onNavigate('replacement')
                      }}
                    >
                      Fill gap
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Activity</h2>
            </div>
            <ul className="activity-list">
              {state.activity.slice(0, 8).map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
