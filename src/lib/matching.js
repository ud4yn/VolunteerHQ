import { ROLE_SKILLS } from '../data/catalog'
import { shiftSlot } from './utils'

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

export function rankReplacements(shift, volunteers, assignments) {
  const taken = new Set(
    activeAssignments(assignments, shift.id).map((item) => item.volunteerId),
  )
  const needed = requiredSkillsFor(shift.role)
  const slot = shiftSlot(shift)

  return volunteers
    .filter((volunteer) => volunteer.status === 'active' && !taken.has(volunteer.id))
    .map((volunteer) => {
      const matchedSkills = volunteer.skills.filter((skill) => needed.includes(skill))
      const availabilityHit = volunteer.availability.includes(slot)
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
      if (availabilityHit) {
        score += 40
        reasons.push(`free for ${slot}`)
      } else {
        score -= 12
        reasons.push('availability gap')
      }

      const otherLoad = assignments.filter(
        (item) =>
          item.volunteerId === volunteer.id &&
          item.status !== 'dropped' &&
          item.status !== 'absent',
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
        availabilityHit,
        slot,
        reasons,
      }
    })
    .sort((a, b) => b.score - a.score || a.volunteer.name.localeCompare(b.volunteer.name))
}
