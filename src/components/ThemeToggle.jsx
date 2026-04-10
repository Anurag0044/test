import { useTheme } from '../context/ThemeContext'
import './ThemeToggle.css'

export default function ThemeToggle({ variant = 'default' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      className={`theme-toggle theme-toggle-${variant}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      <div className="theme-toggle-track">
        <div className={`theme-toggle-thumb ${isDark ? 'theme-toggle-dark' : ''}`}>
          <span className="material-icons-outlined theme-toggle-icon">
            {isDark ? 'dark_mode' : 'light_mode'}
          </span>
        </div>
        <div className="theme-toggle-stars">
          <div className="theme-star theme-star-1" />
          <div className="theme-star theme-star-2" />
          <div className="theme-star theme-star-3" />
        </div>
      </div>
    </button>
  )
}
