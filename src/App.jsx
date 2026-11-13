import { useEffect, useState } from 'react'
import { ConfirmDialog, Toasts } from './components/Chrome'
import Attendance from './pages/Attendance'
import Dashboard from './pages/Dashboard'
import Replacement from './pages/Replacement'
import Shifts from './pages/Shifts'
import Volunteers from './pages/Volunteers'
import { AppStoreProvider, useAppStore } from './store/AppStore'

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'shifts', label: 'Shifts' },
  { id: 'volunteers', label: 'Volunteers' },
  { id: 'replacement', label: 'Replacement' },
  { id: 'attendance', label: 'Attendance' },
]

function Shell() {
  const { resetDemo, metrics } = useAppStore()
  const [page, setPage] = useState('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [page])

  const go = (id) => setPage(id)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="bolt" aria-hidden="true" />
          <div>
            <strong>VOLTHQ</strong>
            <small>Shift intelligence</small>
          </div>
        </div>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'nav-on' : ''}
              onClick={() => go(item.id)}
            >
              {item.label}
              {item.id === 'replacement' && metrics.understaffedCount > 0 ? (
                <em>{metrics.understaffedCount}</em>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <p>Helix Summit · Day ops</p>
          <button type="button" className="btn ghost full" onClick={resetDemo}>
            Reset demo data
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button type="button" className="menu-btn" onClick={() => setMenuOpen((open) => !open)}>
            Menu
          </button>
          <div className="search-ghost">Live event control · local only</div>
          <div className="top-meta">
            <span>{metrics.fillPct}% filled</span>
            <span>{metrics.attendancePct}% present</span>
          </div>
        </header>
        {page === 'dashboard' ? <Dashboard onNavigate={go} /> : null}
        {page === 'shifts' ? <Shifts onNavigate={go} /> : null}
        {page === 'volunteers' ? <Volunteers /> : null}
        {page === 'replacement' ? <Replacement /> : null}
        {page === 'attendance' ? <Attendance /> : null}
      </div>

      {menuOpen ? <button type="button" className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close menu" /> : null}
      <Toasts />
      <ConfirmDialog />
    </div>
  )
}

export default function App() {
  return (
    <AppStoreProvider>
      <Shell />
    </AppStoreProvider>
  )
}
