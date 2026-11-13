import { useMemo, useState } from 'react'
import { SKILLS, SLOTS, VOLUNTEER_STATUSES } from '../data/catalog'
import { Avatar, Field, Modal, StatusBadge } from '../components/Chrome'
import { formatDate, formatTime } from '../lib/utils'
import { useAppStore } from '../store/AppStore'

const emptyVolunteer = {
  name: '',
  email: '',
  phone: '',
  skills: [],
  availability: [],
  status: 'active',
  notes: '',
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export default function Volunteers() {
  const store = useAppStore()
  const { state, saveVolunteer, deleteVolunteer, setAssignmentStatus } = store
  const [query, setQuery] = useState('')
  const [skill, setSkill] = useState('all')
  const [status, setStatus] = useState('all')
  const [slot, setSlot] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyVolunteer)
  const [errors, setErrors] = useState({})
  const [profileId, setProfileId] = useState(null)

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return state.volunteers.filter((volunteer) => {
      if (skill !== 'all' && !volunteer.skills.includes(skill)) return false
      if (status !== 'all' && volunteer.status !== status) return false
      if (slot !== 'all' && !volunteer.availability.includes(slot)) return false
      if (!q) return true
      return [volunteer.name, volunteer.email, volunteer.phone, volunteer.skills.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [state.volunteers, query, skill, status, slot])

  const openCreate = () => {
    setEditing('new')
    setForm(emptyVolunteer)
    setErrors({})
  }

  const submit = (event) => {
    event.preventDefault()
    const result = saveVolunteer(form, editing === 'new' ? null : editing)
    if (!result.ok) {
      setErrors(result.errors)
      return
    }
    setEditing(null)
  }

  const profile = profileId ? store.volunteer(profileId) : null
  const assignments = profile
    ? state.assignments.filter((item) => item.volunteerId === profile.id)
    : []

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Roster</p>
          <h1>Volunteer management</h1>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add volunteer
        </button>
      </header>

      <div className="toolbar">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, email, skill"
        />
        <select value={skill} onChange={(event) => setSkill(event.target.value)}>
          <option value="all">All skills</option>
          {SKILLS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={slot} onChange={(event) => setSlot(event.target.value)}>
          <option value="all">Any availability</option>
          {SLOTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All statuses</option>
          {VOLUNTEER_STATUSES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              <th>Volunteer</th>
              <th>Skills</th>
              <th>Availability</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((volunteer) => (
              <tr key={volunteer.id}>
                <td>
                  <div className="person">
                    <Avatar name={volunteer.name} />
                    <div>
                      <strong>{volunteer.name}</strong>
                      <div className="muted">{volunteer.email}</div>
                      <div className="muted">{volunteer.phone}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="chip-row">
                    {volunteer.skills.map((item) => (
                      <span key={item} className="chip">
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{volunteer.availability.join(', ')}</td>
                <td>
                  <StatusBadge value={volunteer.status} />
                </td>
                <td className="row-actions">
                  <button type="button" className="btn ghost" onClick={() => setProfileId(volunteer.id)}>
                    Profile
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setEditing(volunteer.id)
                      setForm({ ...volunteer })
                      setErrors({})
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="btn danger-ghost" onClick={() => deleteVolunteer(volunteer.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <Modal title={editing === 'new' ? 'Add volunteer' : 'Edit volunteer'} onClose={() => setEditing(null)} wide>
          <form className="form" onSubmit={submit}>
            <div className="form-row">
              <Field label="Full name" error={errors.name}>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="Status" error={errors.status}>
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {VOLUNTEER_STATUSES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="form-row">
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </Field>
              <Field label="Phone" error={errors.phone}>
                <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
            </div>
            <Field label="Skills" error={errors.skills}>
              <div className="check-grid">
                {SKILLS.map((item) => (
                  <label key={item} className="check">
                    <input
                      type="checkbox"
                      checked={form.skills.includes(item)}
                      onChange={() => setForm({ ...form, skills: toggle(form.skills, item) })}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Availability" error={errors.availability}>
              <div className="check-grid">
                {SLOTS.map((item) => (
                  <label key={item} className="check">
                    <input
                      type="checkbox"
                      checked={form.availability.includes(item)}
                      onChange={() => setForm({ ...form, availability: toggle(form.availability, item) })}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Notes">
              <textarea
                rows="3"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
              />
            </Field>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Save volunteer
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {profile ? (
        <Modal title={profile.name} onClose={() => setProfileId(null)} wide>
          <div className="profile-grid">
            <div>
              <p className="muted">{profile.email}</p>
              <p className="muted">{profile.phone}</p>
              <p>{profile.notes}</p>
              <div className="chip-row">
                {profile.skills.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3>Assignments</h3>
              {assignments.length === 0 ? <p className="muted">No shifts yet.</p> : null}
              <ul className="assign-list">
                {assignments.map((item) => {
                  const shift = store.shift(item.shiftId)
                  if (!shift) return null
                  return (
                    <li key={item.id}>
                      <div>
                        <strong>{shift.title}</strong>
                        <p className="muted">
                          {formatDate(shift.date)} · {formatTime(shift.startTime)}
                        </p>
                      </div>
                      <StatusBadge value={item.status} />
                      <div className="row-actions">
                        {item.status === 'registered' ? (
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setAssignmentStatus(item.id, 'checked-in')}
                          >
                            Check in
                          </button>
                        ) : null}
                        {item.status === 'checked-in' ? (
                          <button
                            type="button"
                            className="btn ghost"
                            onClick={() => setAssignmentStatus(item.id, 'checked-out')}
                          >
                            Check out
                          </button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
