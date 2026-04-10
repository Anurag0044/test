import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
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
  const { user, logout } = useAuth()

  // Generate avatar initials from displayName or email
  function getInitials() {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return '?'
  }

  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

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
        {bottomItems.map((item) => (
          <a key={item.label} href={item.path} className="nav-item">
            <span className="material-icons-outlined nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </a>
        ))}
        <button className="nav-item nav-item-logout" onClick={handleLogout}>
          <span className="material-icons-outlined nav-icon">logout</span>
          <span className="nav-label">Logout</span>
        </button>

        <div className="sidebar-user">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt="Avatar"
              className="sidebar-avatar-img"
            />
          ) : (
            <div className="sidebar-avatar">{getInitials()}</div>
          )}
          <div>
            <div className="sidebar-user-name">
              {user?.displayName || 'User'}
            </div>
            <div className="sidebar-user-role">
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
