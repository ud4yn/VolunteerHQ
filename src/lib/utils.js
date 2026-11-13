import { WEEKDAY_TO_PREFIX } from '../data/catalog'

export const STORAGE_KEY = 'volthq.v1'

export function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const date = new Date(`${iso}T12:00:00`)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(value) {
  if (!value) return '—'
  const [h, m] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function weekdayPrefix(iso) {
  const date = new Date(`${iso}T12:00:00`)
  const day = date.toLocaleDateString('en-US', { weekday: 'short' })
  return WEEKDAY_TO_PREFIX[day] || 'Sat'
}

export function shiftSlot(shift) {
  const prefix = weekdayPrefix(shift.date)
  const hour = Number(String(shift.startTime).slice(0, 2))
  return `${prefix} ${hour < 12 ? 'AM' : 'PM'}`
}

export function timeToMinutes(value) {
  const [h, m] = String(value).split(':').map(Number)
  return h * 60 + m
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
}

export function relativeTime(iso) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.max(0, now - then)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export function percent(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}
