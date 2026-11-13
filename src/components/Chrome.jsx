import { filledCount } from '../lib/matching'
import { formatDate, formatTime, initials, relativeTime } from '../lib/utils'
import { useAppStore } from '../store/useAppStore'

export function StatusBadge({ value }) {
  return <span className={`badge badge-${value}`}>{value.replace('-', ' ')}</span>
}

export function FillMeter({ shift }) {
  const { state } = useAppStore()
  const filled = filledCount(state.assignments, shift.id)
  const pct = Math.min(100, Math.round((filled / Math.max(shift.capacity, 1)) * 100))
  const tone = filled < shift.capacity ? 'warn' : 'ok'
  return (
    <div className="fill-meter">
      <div className="fill-meter-top">
        <span>
          {filled}/{shift.capacity}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="track">
        <div className={`bar bar-${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog() {
  const { confirm } = useAppStore()
  if (!confirm) return null
  return (
    <div className="modal-backdrop" onClick={confirm.onCancel} role="presentation">
      <div className="modal" role="alertdialog" onClick={(event) => event.stopPropagation()}>
        <header className="modal-head">
          <h2>{confirm.title}</h2>
        </header>
        <p className="modal-copy">{confirm.body}</p>
        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={confirm.onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${confirm.danger ? 'danger' : 'primary'}`}
            onClick={confirm.onConfirm}
          >
            {confirm.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useAppStore()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`toast toast-${item.tone}`}
          onClick={() => dismissToast(item.id)}
        >
          {item.message}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error ? <em className="field-error">{error}</em> : null}
    </label>
  )
}

export function Empty({ title, copy, action }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{copy}</p>
      {action}
    </div>
  )
}

export function Avatar({ name }) {
  return <span className="avatar">{initials(name)}</span>
}

export function ShiftMeta({ shift }) {
  return (
    <p className="muted tight">
      {shift.role} · {shift.location}
      <br />
      {formatDate(shift.date)} · {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
    </p>
  )
}

export function ActivityItem({ item }) {
  return (
    <li className={`activity activity-${item.type}`}>
      <span className="dot" />
      <div>
        <p>{item.message}</p>
        <small>{relativeTime(item.at)}</small>
      </div>
    </li>
  )
}
