import { ROLE_SKILLS } from '../data/catalog'
import { shiftSlot, timeToMinutes } from './utils'

export function requiredSkillsFor(role) {
  return ROLE_SKILLS[role] || []
}

export function activeAssignments(assignments, shiftId) {
  return assignments.filter(
    (item) => item.shiftId === shiftId && item.status !== 'dropped',
  )
}

export function filledCount(assignments, shiftId) {
  return activeAssignments(assignments, shiftId).length
}

export function isUnderstaffed(shift, assignments) {
  if (shift.status === 'cancelled' || shift.status === 'completed') return false
  return filledCount(assignments, shift.id) < shift.capacity
}

function isLiveAssignment(assignment) {
  return !['dropped', 'absent', 'checked-out'].includes(assignment.status)
}

export function volunteerShiftEligibility(shift, volunteer, assignments, shifts) {
  if (volunteer.status !== 'active') {
    return { eligible: false, message: 'Volunteer is inactive.' }
  }

  const sameShiftAssignments = assignments.filter(
    (item) => item.shiftId === shift.id && item.volunteerId === volunteer.id,
  )

  if (sameShiftAssignments.some((item) => item.status === 'dropped')) {
    return {
      eligible: false,
      message: 'This volunteer already dropped out of this shift.',
    }
  }

  if (sameShiftAssignments.some(isLiveAssignment)) {
    return { eligible: false, message: 'Already assigned to this shift.' }
  }

  const slot = shiftSlot(shift)

  if (!volunteer.availability?.includes(slot)) {
    return {
      eligible: false,
      message: `Not available for ${slot}.`,
    }
  }

  const start = timeToMinutes(shift.startTime)
  const end = timeToMinutes(shift.endTime)

  const conflict = assignments.find((item) => {
    if (item.volunteerId !== volunteer.id || !isLiveAssignment(item)) return false

    const otherShift = shifts.find((candidate) => candidate.id === item.shiftId)
    if (!otherShift || otherShift.id === shift.id) return false
    if (['cancelled', 'completed'].includes(otherShift.status)) return false
    if (otherShift.date !== shift.date) return false

    const otherStart = timeToMinutes(otherShift.startTime)
    const otherEnd = timeToMinutes(otherShift.endTime)

    return start < otherEnd && otherStart < end
  })

  if (conflict) {
    return {
      eligible: false,
      message: 'Already assigned to an overlapping shift.',
    }
  }

  return { eligible: true, message: 'Available and schedule-compatible.' }
}

export function rankReplacements(shift, volunteers, assignments, shifts = []) {
  const needed = requiredSkillsFor(shift.role)
  const slot = shiftSlot(shift)

  return volunteers
    .filter((volunteer) =>
      volunteerShiftEligibility(shift, volunteer, assignments, shifts).eligible,
    )
    .map((volunteer) => {
      const matchedSkills = volunteer.skills.filter((skill) => needed.includes(skill))
      let score = 0
      const reasons = []

      if (matchedSkills.length) {
        score += matchedSkills.length * 32
        reasons.push(`${matchedSkills.length} matching skill${matchedSkills.length > 1 ? 's' : ''}`)
      }

      if (volunteer.skills.includes(shift.role)) {
        score += 18
        reasons.push('direct role experience')
      }

      score += 40
      reasons.push(`available for ${slot}`)

      const otherLoad = assignments.filter(
        (item) =>
          item.volunteerId === volunteer.id &&
          item.shiftId !== shift.id &&
          isLiveAssignment(item),
      ).length

      if (otherLoad === 0) {
        score += 8
        reasons.push('no other live assignments')
      } else {
        score -= otherLoad * 4
        reasons.push(`${otherLoad} other assignment${otherLoad > 1 ? 's' : ''}`)
      }

      score = Math.max(0, Math.min(100, score))

      return {
        volunteer,
        score,
        matchedSkills,
        availabilityHit: true,
        slot,
        reasons,
      }
    })
    .sort((a, b) => b.score - a.score || a.volunteer.name.localeCompare(b.volunteer.name))
}
