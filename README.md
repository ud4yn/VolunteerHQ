# VolunteerHQ — Smarter Volunteer & Shift Management

<p align="center">
  <strong>Plan shifts. Manage volunteers. Handle last-minute dropouts.</strong>
</p>

<p align="center">
  <a href="https://volunteer-hq-kappa.vercel.app/">Live Demo</a> ·
  <a href="https://github.com/ud4yn/VolunteerHQ">GitHub Repository</a>
</p>

---

## Overview

**VolunteerHQ** is a browser-based volunteer and shift management platform designed to help event organisers coordinate volunteers, monitor staffing levels, manage attendance, and respond to unexpected volunteer dropouts.

At events, a single last-minute cancellation can leave an important role understaffed. Finding a suitable replacement manually can waste valuable time.

VolunteerHQ addresses this problem through a rule-based volunteer matching engine that evaluates skills, availability, existing assignments, and scheduling conflicts to recommend suitable replacements.

The goal is simple: **keep every event staffed, organised, and running smoothly.**

## The Problem

Event organisers often face challenges such as:

- Managing multiple shifts and volunteer assignments.
- Identifying understaffed roles.
- Tracking volunteer attendance.
- Finding suitable replacements when volunteers cancel.
- Avoiding scheduling conflicts when reassigning volunteers.

Traditional spreadsheets and manual coordination can make these tasks difficult, especially when changes happen at the last minute.

## Our Solution

VolunteerHQ brings these operations together in one interface.

Organisers can create shifts, manage volunteer information, monitor staffing, track attendance, and use the replacement engine to respond to unexpected cancellations.

### Key Features

| Feature | Description |
|---|---|
| Dashboard | Overview of staffing, attendance, upcoming shifts, and understaffed roles. |
| Shift Management | Create, edit, and manage event shifts, roles, timings, locations, and capacities. |
| Volunteer Management | Maintain volunteer profiles, skills, availability, and active status. |
| Registration | Assign volunteers to shifts while checking eligibility and capacity. |
| Attendance Tracking | Track volunteer assignment and attendance statuses. |
| Dropout Simulation | Simulate a last-minute volunteer cancellation. |
| Replacement Engine | Identify eligible replacements and rank them based on suitability. |
| Persistent Demo Data | Save application state in browser local storage. |

## The Highlight: Intelligent Replacement Engine

The central feature of VolunteerHQ is its volunteer replacement system.

When a volunteer drops out, the system evaluates the remaining volunteer pool and recommends suitable candidates.

### How it works

1. **Simulate a dropout:** The organiser selects a volunteer and simulates their cancellation.
2. **Update staffing:** The assignment is marked as dropped, and the shift's staffing count is recalculated.
3. **Detect understaffing:** The system identifies that the shift has fewer active assignments than its required capacity.
4. **Filter candidates:** Volunteers are checked for eligibility.
5. **Rank replacements:** Eligible candidates receive suitability scores.
6. **Assign replacement:** The organiser selects a recommended volunteer to fill the vacancy.

### Candidate eligibility checks

A volunteer must:

- Have an active status.
- Be available for the shift's time slot.
- Not already be assigned to the same shift.
- Not have previously dropped out of that same shift.
- Not have an overlapping live assignment on the same date.

Candidates who fail these checks are excluded.

### Matching and ranking logic

Eligible candidates are ranked using a weighted scoring system.

| Matching factor | Score |
|---|---:|
| Each matching required skill | +32 |
| Direct experience with the shift role | +18 |
| Availability for the shift | +40 |
| No other live assignments | +8 |
| Each other live assignment | -4 |

The final score is clamped between 0 and 100.

Candidates are sorted by their score, with alphabetical ordering used when scores are tied.

**Example:** A volunteer with one matching skill, direct role experience, availability, and no other live assignments receives:

`32 + 18 + 40 + 8 = 98 / 100`

This makes the recommendation process transparent and understandable to organisers.

> VolunteerHQ uses deterministic, rule-based matching rather than a trained machine-learning model. The scoring system is designed to provide explainable recommendations.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| Vite | Development server and build tooling |
| JavaScript | Application logic and matching engine |
| CSS | Styling and responsive interface |
| Browser localStorage | Local persistence of application state |
| Git & GitHub | Version control and collaboration |
| Vercel | Deployment and hosting |

## Application Architecture

The application separates the interface, state management, and business logic.

```text
VolunteerHQ
│
├── src/
│   ├── components/       Reusable UI components
│   │
│   ├── data/             Sample data and catalogs
│   │
│   ├── lib/
│   │   ├── matching.js   Eligibility and ranking logic
│   │   ├── metrics.js    Dashboard calculations
│   │   └── utils.js      Shared utility functions
│   │
│   ├── pages/            Application pages
│   │
│   ├── store/
│   │   ├── AppStore.jsx  Shared state and operations
│   │   └── useAppStore.js
│   │
│   └── App.jsx           Main application
│
├── package.json
└── README.md
```

### Data flow

```text
Organiser Interaction
        |
        v
    React UI
        |
        v
   AppStore / Context
        |
        v
 Business Logic
        |
        +---- Matching Engine
        |
        +---- Dashboard Metrics
        |
        v
   Updated Application State
        |
        v
    localStorage
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/ud4yn/VolunteerHQ.git
```

Navigate into the project:

```bash
cd VolunteerHQ
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

### Production build

To create a production build:

```bash
npm run build
```

To run the project's lint checks:

```bash
npm run lint
```

## Demo Walkthrough

To experience the main workflow:

1. Open the [VolunteerHQ live demo](https://volunteer-hq-kappa.vercel.app/).
2. Explore the dashboard and existing shifts.
3. Review volunteer profiles, skills, and availability.
4. Open the replacement management interface.
5. Select a shift and simulate a volunteer dropout.
6. Observe the understaffing status and replacement recommendations.
7. Assign an eligible replacement.
8. Verify that the staffing count updates.

The application includes sample data to make the workflow demonstrable without requiring external services.

## Design Principles

VolunteerHQ is built around four principles:

- **Clarity:** Organisers should immediately understand staffing conditions.
- **Reliability:** Eligibility checks should prevent unsuitable assignments.
- **Transparency:** Replacement recommendations should have understandable reasons.
- **Human control:** Organisers make the final reassignment decision instead of relying on automatic assignment.

## Current Scope and Limitations

VolunteerHQ is currently a browser-first prototype designed around sample data and local calculations.

- Application data is stored in browser localStorage.
- Data is not synchronised between different devices or browsers.
- Volunteer availability currently uses broad weekday and AM/PM time slots.
- Notifications through SMS, email, or WhatsApp are not integrated.
- The matching engine uses predefined rules and weighted scoring, not machine learning.
- Authentication and a central backend database are not implemented.

These limitations define the current prototype scope and provide opportunities for future development.

## Future Improvements

Potential enhancements include:

- Centralised database and multi-user synchronisation.
- Volunteer self-service registration and availability management.
- Real-time updates for organisers.
- Email and push notifications for shift changes.
- More granular availability and scheduling.
- Historical volunteer reliability and preference-based matching.
- Analytics for event staffing and volunteer participation.

## Hackathon Context

**Built for VibeSprint 1.0 — OWASP NIE**

Challenge: **VolunteerHQ**

The project explores how a simple, explainable decision-support system can help event organisers manage volunteers and respond to last-minute staffing disruptions.

## Team

**GitHub:** [@ud4yn](https://github.com/ud4yn)

---

<p align="center">
  <strong>VolunteerHQ — Because every role matters.</strong>
</p>