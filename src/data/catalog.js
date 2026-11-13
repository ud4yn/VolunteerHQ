export const ROLES = [
  'Registration',
  'Stage Crew',
  'Medical',
  'Hospitality',
  'Security',
  'AV Tech',
  'Guest Relations',
  'Crowd Flow',
]

export const SKILLS = [
  'Guest Relations',
  'Communication',
  'Languages',
  'Logistics',
  'AV Tech',
  'Physical',
  'First Aid',
  'CPR',
  'Food Service',
  'Crowd Control',
  'Lighting',
  'Radio Ops',
]

export const ROLE_SKILLS = {
  Registration: ['Guest Relations', 'Communication', 'Languages'],
  'Stage Crew': ['Logistics', 'AV Tech', 'Physical'],
  Medical: ['First Aid', 'CPR'],
  Hospitality: ['Guest Relations', 'Food Service', 'Communication'],
  Security: ['Crowd Control', 'First Aid', 'Radio Ops'],
  'AV Tech': ['AV Tech', 'Lighting', 'Radio Ops'],
  'Guest Relations': ['Guest Relations', 'Communication', 'Languages'],
  'Crowd Flow': ['Crowd Control', 'Logistics', 'Radio Ops'],
}

export const LOCATIONS = [
  'Hall A — North Entrance',
  'Main Arena',
  'North Gate Clinic',
  'VIP Lounge',
  'Plaza Concourse',
  'Studio B',
  'Perimeter Loop',
  'Info Hub',
  'West Loading Dock',
  'Press Gallery',
]

export const SHIFT_STATUSES = ['scheduled', 'live', 'completed', 'cancelled']
export const VOLUNTEER_STATUSES = ['active', 'inactive']
export const ASSIGNMENT_STATUSES = [
  'registered',
  'checked-in',
  'checked-out',
  'absent',
  'dropped',
]

export const SLOTS = [
  'Fri AM',
  'Fri PM',
  'Sat AM',
  'Sat PM',
  'Sun AM',
  'Sun PM',
]

export const WEEKDAY_TO_PREFIX = {
  Fri: 'Fri',
  Sat: 'Sat',
  Sun: 'Sun',
  Mon: 'Fri',
  Tue: 'Fri',
  Wed: 'Sat',
  Thu: 'Sat',
}
