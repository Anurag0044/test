import { NavLink, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import './Sidebar.css'

const navItems = [
  { path: '/app/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { path: '/app/analyzer', icon: 'analytics', label: 'Analyzer' },
  { path: '/app/comparison', icon: 'compare_arrows', label: 'Comparison' },
  { path: '/app/pharmacy', icon: 'local_pharmacy', label: 'Pharmacy' },
  { path: '/app/history', icon: 'history', label: 'History' },
  { path: '/app/profile', icon: 'person', label: 'Profile' },
  { path: '/app/settings', icon: 'settings', label: 'Settings' },
]

const bottomItems = [
  { path: '#', icon: 'help', label: 'Support' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
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
            >
              <span className="material-icons-outlined nav-icon">{item.icon}</span>
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
          <a key={item.label} href={item.path} className="nav-item">
            <span className="material-icons-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
        <button className="nav-item nav-item-logout" onClick={() => navigate('/login')}>
          <span className="material-icons-outlined nav-icon">logout</span>
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
