import { filledCount, isUnderstaffed } from './matching'
import { percent } from './utils'

export function computeMetrics(state) {
  const { volunteers, shifts, assignments } = state
  const liveShifts = shifts.filter((shift) => shift.status !== 'cancelled')
  const totalCapacity = liveShifts.reduce((sum, shift) => sum + shift.capacity, 0)
  const filledPositions = liveShifts.reduce(
    (sum, shift) => sum + filledCount(assignments, shift.id),
    0,
  )
  const understaffed = liveShifts.filter((shift) => isUnderstaffed(shift, assignments))
  const activeShifts = shifts.filter(
    (shift) => shift.status === 'scheduled' || shift.status === 'live',
  ).length

  const relevant = assignments.filter((item) => item.status !== 'dropped')
  const checkedIn = relevant.filter(
    (item) => item.status === 'checked-in' || item.status === 'checked-out',
  ).length
  const absent = relevant.filter((item) => item.status === 'absent').length
  const registered = relevant.filter((item) => item.status === 'registered').length

  return {
    totalVolunteers: volunteers.length,
    activeVolunteers: volunteers.filter((item) => item.status === 'active').length,
    activeShifts,
    filledPositions,
    totalCapacity,
    understaffedCount: understaffed.length,
    understaffed,
    attendancePct: percent(checkedIn, relevant.length),
    registered,
    checkedIn,
    absent,
    fillPct: percent(filledPositions, totalCapacity),
  }
}
