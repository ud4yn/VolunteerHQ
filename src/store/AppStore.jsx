import { useEffect, useState } from 'react'
import { AppStoreContext } from './AppStoreContext'
import { createSeedState } from '../data/seed'
import { filledCount, isUnderstaffed, volunteerShiftEligibility } from '../lib/matching'
import { computeMetrics } from '../lib/metrics'
import { createId, isValidEmail, STORAGE_KEY, timeToMinutes } from '../lib/utils'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw)
    if (!parsed?.volunteers || !parsed?.shifts || !parsed?.assignments) {
      return createSeedState()
    }
    return {
      volunteers: parsed.volunteers,
      shifts: parsed.shifts,
      assignments: parsed.assignments,
      activity: parsed.activity || [],
    }
  } catch {
    return createSeedState()
  }
}

function volunteerById(state, id) {
  return state.volunteers.find((item) => item.id === id)
}

function shiftById(state, id) {
  return state.shifts.find((item) => item.id === id)
}

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(loadState)
  const [toasts, setToasts] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [focusShiftId, setFocusShiftId] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const toast = (message, tone = 'info') => {
    const id = createId('toast')
    setToasts((list) => [...list, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id))
    }, 3200)
  }

  const dismissToast = (id) => {
    setToasts((list) => list.filter((item) => item.id !== id))
  }

  const ask = (options) =>
    new Promise((resolve) => {
      setConfirm({
        ...options,
        onConfirm: () => {
          setConfirm(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirm(null)
          resolve(false)
        },
      })
    })

  const log = (draft, type, message) => {
    draft.activity = [
      { id: createId('act'), type, message, at: new Date().toISOString() },
      ...draft.activity,
    ].slice(0, 40)
  }

  const mutate = (updater) => {
    setState((prev) => {
      const draft = {
        volunteers: [...prev.volunteers],
        shifts: [...prev.shifts],
        assignments: [...prev.assignments],
        activity: [...prev.activity],
      }
      updater(draft)
      return draft
    })
  }

  const validateShift = (payload, ignoreId) => {
    const errors = {}
    if (!payload.title?.trim()) errors.title = 'Title is required.'
    if (!payload.role) errors.role = 'Role is required.'
    if (!payload.location?.trim()) errors.location = 'Location is required.'
    if (!payload.date) errors.date = 'Date is required.'
    if (!payload.startTime) errors.startTime = 'Start time is required.'
    if (!payload.endTime) errors.endTime = 'End time is required.'
    if (payload.startTime && payload.endTime && timeToMinutes(payload.endTime) <= timeToMinutes(payload.startTime)) {
      errors.endTime = 'End time must be after start time.'
    }
    const capacity = Number(payload.capacity)
    if (!Number.isFinite(capacity) || capacity < 1 || !Number.isInteger(capacity)) {
      errors.capacity = 'Capacity must be a whole number of at least 1.'
    }
    if (!payload.status) errors.status = 'Status is required.'
    if (ignoreId) {
      const current = filledCount(state.assignments, ignoreId)
      if (capacity < current) {
        errors.capacity = `Capacity cannot drop below ${current} assigned volunteer${current === 1 ? '' : 's'}.`
      }
    }
    return errors
  }

  const validateVolunteer = (payload, ignoreId) => {
    const errors = {}
    if (!payload.name?.trim()) errors.name = 'Name is required.'
    if (!payload.email?.trim()) errors.email = 'Email is required.'
    else if (!isValidEmail(payload.email)) errors.email = 'Enter a valid email.'
    else {
      const taken = state.volunteers.some(
        (item) => item.email.toLowerCase() === payload.email.trim().toLowerCase() && item.id !== ignoreId,
      )
      if (taken) errors.email = 'That email is already in the roster.'
    }
    if (!payload.phone?.trim()) errors.phone = 'Phone is required.'
    if (!payload.skills?.length) errors.skills = 'Select at least one skill.'
    if (!payload.availability?.length) errors.availability = 'Select at least one availability window.'
    if (!payload.status) errors.status = 'Status is required.'
    return errors
  }

  const api = {
    state,
    toasts,
    confirm,
    focusShiftId,
    setFocusShiftId,
    toast,
    dismissToast,
    ask,
    metrics: computeMetrics(state),
    validateShift,
    validateVolunteer,

    saveShift(payload, id) {
      const errors = validateShift(payload, id)
      if (Object.keys(errors).length) return { ok: false, errors }
      mutate((draft) => {
        if (id) {
          const index = draft.shifts.findIndex((item) => item.id === id)
          if (index >= 0) {
            draft.shifts[index] = { ...draft.shifts[index], ...payload, capacity: Number(payload.capacity) }
            log(draft, 'shift', `Shift updated: ${payload.title}.`)
          }
        } else {
          const shift = { ...payload, id: createId('s'), capacity: Number(payload.capacity) }
          draft.shifts.unshift(shift)
          log(draft, 'shift', `Shift created: ${shift.title}.`)
        }
      })
      toast(id ? 'Shift saved.' : 'Shift created.', 'success')
      return { ok: true }
    },

    async deleteShift(id) {
      const shift = shiftById(state, id)
      if (!shift) return
      const ok = await ask({
        title: 'Delete shift',
        body: `Remove “${shift.title}” and every assignment on it? This cannot be undone.`,
        confirmLabel: 'Delete shift',
        danger: true,
      })
      if (!ok) return
      mutate((draft) => {
        draft.shifts = draft.shifts.filter((item) => item.id !== id)
        draft.assignments = draft.assignments.filter((item) => item.shiftId !== id)
        log(draft, 'shift', `Shift deleted: ${shift.title}.`)
      })
      toast('Shift deleted.', 'success')
    },

    saveVolunteer(payload, id) {
      const errors = validateVolunteer(payload, id)
      if (Object.keys(errors).length) return { ok: false, errors }
      const next = {
        ...payload,
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
        notes: payload.notes?.trim() || '',
      }
      mutate((draft) => {
        if (id) {
          const index = draft.volunteers.findIndex((item) => item.id === id)
          if (index >= 0) {
            draft.volunteers[index] = { ...draft.volunteers[index], ...next }
            log(draft, 'volunteer', `${next.name} was updated.`)
          }
        } else {
          draft.volunteers.unshift({ ...next, id: createId('v') })
          log(draft, 'volunteer', `${next.name} joined the roster.`)
        }
      })
      toast(id ? 'Volunteer saved.' : 'Volunteer added.', 'success')
      return { ok: true }
    },

    async deleteVolunteer(id) {
      const volunteer = volunteerById(state, id)
      if (!volunteer) return
      const ok = await ask({
        title: 'Remove volunteer',
        body: `Remove ${volunteer.name} from the roster and drop their assignments?`,
        confirmLabel: 'Remove',
        danger: true,
      })
      if (!ok) return
      mutate((draft) => {
        draft.volunteers = draft.volunteers.filter((item) => item.id !== id)
        draft.assignments = draft.assignments.filter((item) => item.volunteerId !== id)
        log(draft, 'volunteer', `${volunteer.name} was removed from the roster.`)
      })
      toast('Volunteer removed.', 'success')
    },

    registerVolunteer(shiftId, volunteerId, options = {}) {
      const shift = shiftById(state, shiftId)
      const volunteer = volunteerById(state, volunteerId)

      if (!shift || !volunteer) {
        return { ok: false, message: 'Missing shift or volunteer.' }
      }

      if (shift.status === 'cancelled' || shift.status === 'completed') {
        return { ok: false, message: 'This shift is closed.' }
      }

      if (filledCount(state.assignments, shiftId) >= shift.capacity) {
        return { ok: false, message: 'Shift is at capacity.' }
      }

      const eligibility = volunteerShiftEligibility(
        shift,
        volunteer,
        state.assignments,
        state.shifts,
      )

      if (!eligibility.eligible) {
        return { ok: false, message: eligibility.message }
      }

      const asReplacement = options.asReplacement

      mutate((draft) => {
        draft.assignments.push({
          id: createId('a'),
          shiftId,
          volunteerId,
          status: 'registered',
        })

        log(
          draft,
          asReplacement ? 'replace' : 'assign',
          asReplacement
            ? `${volunteer.name} assigned as replacement on ${shift.title}.`
            : `${volunteer.name} registered for ${shift.title}.`,
        )
      })

      toast(
        asReplacement ? `${volunteer.name} assigned as replacement.` : `${volunteer.name} registered.`,
        'success',
      )

      return { ok: true }
    },

    setAssignmentStatus(assignmentId, status) {
      const assignment = state.assignments.find((item) => item.id === assignmentId)
      if (!assignment) return
      const volunteer = volunteerById(state, assignment.volunteerId)
      const shift = shiftById(state, assignment.shiftId)
      mutate((draft) => {
        const index = draft.assignments.findIndex((item) => item.id === assignmentId)
        if (index < 0) return
        draft.assignments[index] = { ...draft.assignments[index], status }
        const label = volunteer?.name || 'Volunteer'
        const shiftName = shift?.title || 'shift'
        if (status === 'checked-in') log(draft, 'checkin', `${label} checked in to ${shiftName}.`)
        if (status === 'checked-out') log(draft, 'checkout', `${label} checked out of ${shiftName}.`)
        if (status === 'absent') log(draft, 'absent', `${label} marked absent on ${shiftName}.`)
        if (status === 'registered') log(draft, 'assign', `${label} restored to registered on ${shiftName}.`)
      })
      toast('Attendance updated.', 'success')
    },

    async simulateDropout(assignmentId) {
      const assignment = state.assignments.find((item) => item.id === assignmentId)
      if (!assignment || assignment.status === 'dropped') return null
      const volunteer = volunteerById(state, assignment.volunteerId)
      const shift = shiftById(state, assignment.shiftId)
      const ok = await ask({
        title: 'Simulate dropout',
        body: `Remove ${volunteer?.name || 'this volunteer'} from “${shift?.title}”? Capacity will be recalculated and replacements ranked.`,
        confirmLabel: 'Simulate dropout',
        danger: true,
      })
      if (!ok) return null
      mutate((draft) => {
        const index = draft.assignments.findIndex((item) => item.id === assignmentId)
        if (index >= 0) draft.assignments[index] = { ...draft.assignments[index], status: 'dropped' }
        const remaining = filledCount(draft.assignments, assignment.shiftId)
        const under = shift ? remaining < shift.capacity : false
        log(
          draft,
          'dropout',
          `${volunteer?.name || 'Volunteer'} dropped from ${shift?.title}. Coverage now ${remaining}/${shift?.capacity || '?'}.`,
        )
        if (under) {
          log(draft, 'alert', `${shift.title} is understaffed (${remaining} of ${shift.capacity}).`)
        }
      })
      setFocusShiftId(assignment.shiftId)
      toast('Dropout simulated. Ranking replacements.', 'warn')
      return assignment.shiftId
    },

    assignReplacement(shiftId, volunteerId) {
      const result = api.registerVolunteer(shiftId, volunteerId, { asReplacement: true })
      if (!result.ok) toast(result.message, 'error')
      return result
    },

    volunteer(id) {
      return volunteerById(state, id)
    },
    shift(id) {
      return shiftById(state, id)
    },

    async resetDemo() {
      const ok = await ask({
        title: 'Reset demo data',
        body: 'This replaces all local VOLTHQ data with the original Helix Summit roster.',
        confirmLabel: 'Reset data',
        danger: true,
      })
      if (!ok) return
      const next = createSeedState()
      setState(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setFocusShiftId(null)
      toast('Demo data restored.', 'success')
    },
  }

  const value = {
    ...api,
    understaffedShifts: state.shifts.filter((shift) => isUnderstaffed(shift, state.assignments)),
  }

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}
