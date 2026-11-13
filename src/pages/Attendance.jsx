import { useMemo, useState } from 'react'
import { Avatar, StatusBadge } from '../components/Chrome'
import { formatDate, formatTime } from '../lib/utils'
import { useAppStore } from '../store/AppStore'

const FILTERS = ['all', 'registered', 'checked-in', 'checked-out', 'absent', 'dropped']

export default function Attendance() {
  const store = useAppStore()
  const { state, metrics, setAssignmentStatus } = store
  const [filter, setFilter] = useState('all')
  const [shiftId, setShiftId] = useState('all')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.assignments
      .map((item) => ({
        ...item,
        volunteer: store.volunteer(item.volunteerId),
        shift: store.shift(item.shiftId),
      }))
      .filter((item) => item.volunteer && item.shift)
      .filter((item) => (filter === 'all' ? true : item.status === filter))
      .filter((item) => (shiftId === 'all' ? true : item.shiftId === shiftId))
      .filter((item) => {
        if (!q) return true
        return `${item.volunteer.name} ${item.shift.title}`.toLowerCase().includes(q)
      })
  }, [state.assignments, state.volunteers, state.shifts, filter, shiftId, query])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Presence</p>
          <h1>Attendance</h1>
        </div>
      </header>

      <section className="stat-grid compact">
        <article className="stat-card">
          <p>Registered</p>
          <strong>{metrics.registered}</strong>
          <span>awaiting check-in</span>
        </article>
        <article className="stat-card">
          <p>Checked in</p>
          <strong>{metrics.checkedIn}</strong>
          <span>on site or completed</span>
        </article>
        <article className="stat-card warn">
          <p>Absent</p>
          <strong>{metrics.absent}</strong>
          <span>no-show recorded</span>
        </article>
        <article className="stat-card">
          <p>Rate</p>
          <strong>{metrics.attendancePct}%</strong>
          <span>checked in vs assigned</span>
        </article>
      </section>

      <div className="toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search volunteer or shift"
        />
        <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
          <option value="all">All shifts</option>
          {state.shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {shift.title}
            </option>
          ))}
        </select>
        <div className="pills">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className={`pill ${filter === item ? 'on' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Volunteer</th>
              <th>Shift</th>
              <th>When</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="person">
                    <Avatar name={row.volunteer.name} />
                    <div>
                      <strong>{row.volunteer.name}</strong>
                      <div className="muted">{row.volunteer.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {row.shift.title}
                  <div className="muted">{row.shift.role}</div>
                </td>
                <td>
                  {formatDate(row.shift.date)}
                  <div className="muted">
                    {formatTime(row.shift.startTime)}–{formatTime(row.shift.endTime)}
                  </div>
                </td>
                <td>
                  <StatusBadge value={row.status} />
                </td>
                <td className="row-actions">
                  {row.status === 'registered' ? (
                    <>
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => setAssignmentStatus(row.id, 'checked-in')}
                      >
                        Check in
                      </button>
                      <button
                        type="button"
                        className="btn danger-ghost"
                        onClick={() => setAssignmentStatus(row.id, 'absent')}
                      >
                        Mark absent
                      </button>
                    </>
                  ) : null}
                  {row.status === 'checked-in' ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setAssignmentStatus(row.id, 'checked-out')}
                    >
                      Check out
                    </button>
                  ) : null}
                  {row.status === 'absent' ? (
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setAssignmentStatus(row.id, 'registered')}
                    >
                      Restore
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
