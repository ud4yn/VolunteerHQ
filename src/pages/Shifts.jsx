import { useMemo, useState } from 'react'
import { LOCATIONS, ROLES, SHIFT_STATUSES } from '../data/catalog'
import { Field, FillMeter, Modal, ShiftMeta, StatusBadge } from '../components/Chrome'
import { filledCount, isUnderstaffed } from '../lib/matching'
import { formatDate, formatTime } from '../lib/utils'
import { useAppStore } from '../store/AppStore'

const emptyShift = {
  title: '',
  role: 'Registration',
  location: LOCATIONS[0],
  date: '2026-11-13',
  startTime: '09:00',
  endTime: '13:00',
  capacity: 4,
  status: 'scheduled',
}

export default function Shifts({ onNavigate }) {
  const store = useAppStore()
  const { state, saveShift, deleteShift, registerVolunteer, toast } = store
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyShift)
  const [errors, setErrors] = useState({})
  const [assignFor, setAssignFor] = useState(null)
  const [volunteerId, setVolunteerId] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.shifts
      .filter((shift) => (role === 'all' ? true : shift.role === role))
      .filter((shift) => (status === 'all' ? true : shift.status === status))
      .filter((shift) => {
        if (!q) return true
        return [shift.title, shift.role, shift.location].join(' ').toLowerCase().includes(q)
      })
  }, [state.shifts, query, role, status])

  const openCreate = () => {
    setEditing('new')
    setForm(emptyShift)
    setErrors({})
  }

  const openEdit = (shift) => {
    setEditing(shift.id)
    setForm({ ...shift })
    setErrors({})
  }

  const submit = (event) => {
    event.preventDefault()
    const result = saveShift(form, editing === 'new' ? null : editing)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setEditing(null)
  }

  const eligible = assignFor
    ? state.volunteers.filter((volunteer) => {
        const taken = state.assignments.some(
          (item) =>
            item.shiftId === assignFor.id &&
            item.volunteerId === volunteer.id &&
            item.status !== 'dropped',
        )
        return volunteer.status === 'active' && !taken
      })
    : []

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Coverage</p>
          <h1>Shift management</h1>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Create shift
        </button>
      </header>

      <div className="toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, role, location"
        />
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {SHIFT_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="card-grid">
        {rows.map((shift) => {
          const filled = filledCount(state.assignments, shift.id)
          const crew = state.assignments.filter(
            (item) => item.shiftId === shift.id && item.status !== 'dropped',
          )
          return (
            <article key={shift.id} className="shift-card">
              <div className="shift-card-top">
                <StatusBadge value={shift.status} />
                {isUnderstaffed(shift, state.assignments) ? (
                  <span className="badge badge-understaffed">understaffed</span>
                ) : (
                  <span className="badge badge-filled">covered</span>
                )}
              </div>
              <h3>{shift.title}</h3>
              <ShiftMeta shift={shift} />
              <FillMeter shift={shift} />
              <ul className="mini-crew">
                {crew.slice(0, 4).map((item) => {
                  const volunteer = store.volunteer(item.volunteerId)
                  return (
                    <li key={item.id}>
                      {volunteer?.name || 'Unknown'} · {item.status}
                    </li>
                  )
                })}
                {crew.length === 0 ? <li className="muted">No volunteers registered yet.</li> : null}
              </ul>
              <div className="card-actions">
                <button type="button" className="btn ghost" onClick={() => openEdit(shift)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  disabled={filled >= shift.capacity || shift.status === 'cancelled' || shift.status === 'completed'}
                  onClick={() => {
                    setAssignFor(shift)
                    setVolunteerId('')
                  }}
                >
                  Register
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    store.setFocusShiftId(shift.id)
                    onNavigate('replacement')
                  }}
                >
                  Replace
                </button>
                <button type="button" className="btn danger-ghost" onClick={() => deleteShift(shift.id)}>
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {editing ? (
        <Modal title={editing === 'new' ? 'Create shift' : 'Edit shift'} onClose={() => setEditing(null)}>
          <form className="form" onSubmit={submit}>
            <Field label="Title" error={errors.title}>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. West Dock load-in"
              />
            </Field>
            <div className="form-row">
              <Field label="Role" error={errors.role}>
                <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                  {ROLES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status" error={errors.status}>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {SHIFT_STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Location" error={errors.location}>
              <select value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })}>
                {LOCATIONS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <div className="form-row">
              <Field label="Date" error={errors.date}>
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                />
              </Field>
              <Field label="Capacity" error={errors.capacity}>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Start" error={errors.startTime}>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm({ ...form, startTime: event.target.value })}
                />
              </Field>
              <Field label="End" error={errors.endTime}>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm({ ...form, endTime: event.target.value })}
                />
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                {editing === 'new' ? 'Create shift' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {assignFor ? (
        <Modal title={`Register volunteer · ${assignFor.title}`} onClose={() => setAssignFor(null)}>
          <p className="muted">
            {formatDate(assignFor.date)} · {formatTime(assignFor.startTime)}–{formatTime(assignFor.endTime)}
          </p>
          <form
            className="form"
            onSubmit={(event) => {
              event.preventDefault()
              if (!volunteerId) {
                toast('Choose a volunteer.', 'error')
                return
              }
              const result = registerVolunteer(assignFor.id, volunteerId)
              if (!result.ok) {
                toast(result.message, 'error')
                return
              }
              setAssignFor(null)
            }}
          >
            <Field label="Volunteer">
              <select value={volunteerId} onChange={(event) => setVolunteerId(event.target.value)}>
                <option value="">Select volunteer</option>
                {eligible.map((volunteer) => (
                  <option key={volunteer.id} value={volunteer.id}>
                    {volunteer.name} · {volunteer.skills.slice(0, 2).join(', ')}
                  </option>
                ))}
              </select>
            </Field>
            {eligible.length === 0 ? <p className="field-error">No eligible volunteers remain.</p> : null}
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setAssignFor(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={!volunteerId}>
                Register
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}
