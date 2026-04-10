import { useRef, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import './Sidebar.css'

const navItems = [
  { path: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/app/analyzer', icon: 'analytics', label: 'Analyzer', hasNotif: true },
  { path: '/app/comparison', icon: 'compare_arrows', label: 'Comparison' },
  { path: '/app/pharmacy', icon: 'local_pharmacy', label: 'Pharmacy' },
  { path: '/app/history', icon: 'history', label: 'History', hasNotif: true },
  { path: '/app/profile', icon: 'person', label: 'Profile' },
  { path: '/app/settings', icon: 'settings', label: 'Settings' },
]

const bottomItems = [
  { path: '#', icon: 'help', label: 'Support' },
]

/* Ripple effect on click */
function createNavRipple(e) {
  const el = e.currentTarget
  const circle = document.createElement('span')
  const rect = el.getBoundingClientRect()
  const size = Math.max(el.clientWidth, el.clientHeight)

  circle.style.width = circle.style.height = `${size}px`
  circle.style.left = `${e.clientX - rect.left - size / 2}px`
  circle.style.top = `${e.clientY - rect.top - size / 2}px`
  circle.classList.add('nav-ripple')

  const prev = el.querySelector('.nav-ripple')
  if (prev) prev.remove()

  el.appendChild(circle)
  setTimeout(() => circle.remove(), 600)
}

export default function Sidebar() {
  const navigate = useNavigate()

  const handleNavClick = useCallback((e) => {
    createNavRipple(e)
    // Scale press animation is handled via CSS :active
  }, [])

  return (
    <aside className="sidebar">
      {/* Decorative glow */}
      <div className="sidebar-glow" aria-hidden="true" />

      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <div className="sidebar-logo-icon">M</div>
          <div>
            <div className="sidebar-brand">MedIntel</div>
            <div className="sidebar-subtitle">Clinical Portal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
              onClick={handleNavClick}
              title={item.label}
            >
              {/* Active indicator bar */}
              <span className="nav-active-bar" aria-hidden="true" />
              <span className="nav-icon-wrap">
                <span className="material-icons-outlined nav-icon">{item.icon}</span>
                {item.hasNotif && <span className="nav-notif-dot" aria-label="New activity" />}
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-bottom">
        {/* Theme Toggle */}
        <div className="sidebar-theme-row">
          <span className="material-icons-outlined nav-icon" style={{ color: 'var(--tertiary-container)' }}>
            contrast
          </span>
          <span className="nav-label" style={{ color: 'var(--tertiary-container)', flex: 1 }}>
            Dark Mode
          </span>
          <ThemeToggle variant="sidebar" />
        </div>

        {bottomItems.map((item) => (
          <a key={item.label} href={item.path} className="nav-item" title={item.label}>
            <span className="nav-active-bar" aria-hidden="true" />
            <span className="nav-icon-wrap">
              <span className="material-icons-outlined nav-icon">{item.icon}</span>
            </span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
        <button
          className="nav-item nav-item-logout"
          onClick={(e) => { createNavRipple(e); setTimeout(() => navigate('/login'), 200) }}
          title="Logout"
        >
          <span className="nav-active-bar" aria-hidden="true" />
          <span className="nav-icon-wrap">
            <span className="material-icons-outlined nav-icon">logout</span>
          </span>
          <span className="nav-label">Logout</span>
        </button>

        <div className="sidebar-user">
          <div className="sidebar-avatar">SC</div>
          <div>
            <div className="sidebar-user-name">Dr. Sarah Chen</div>
            <div className="sidebar-user-role">Chief Resident</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
