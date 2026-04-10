import { useState } from 'react'
import Footer from '../components/Footer'
import './SettingsPage.css'

const settingsData = [
  {
    section: 'Automation & Intelligence',
    items: [
      {
        id: 'ai',
        icon: 'auto_awesome',
        title: 'AI Suggestions',
        desc: 'Enable machine learning models to provide predictive diagnostic paths and drug interaction warnings in real-time.',
        defaultOn: true,
      },
      {
        id: 'notifications',
        icon: 'notifications',
        title: 'Notifications',
        desc: 'Receive critical alerts for patient vitals and laboratory results directly on your desktop and clinical mobile device.',
        defaultOn: true,
      },
      {
        id: 'location',
        icon: 'location_on',
        title: 'Location access',
        desc: 'Required for HIPAA-compliant proximity logging when accessing secure terminals within the facility.',
        defaultOn: false,
      },
      {
        id: 'tfa',
        icon: 'security',
        title: 'Two-Factor Auth',
        desc: 'Strengthen your clinical vault with biometric verification.',
        defaultOn: true,
      },
      {
        id: 'audit',
        icon: 'receipt_long',
        title: 'Audit Logs',
        desc: 'Review detailed logs of all data access and modifications.',
        defaultOn: true,
      },
    ],
  },
]

export default function SettingsPage() {
  const [toggles, setToggles] = useState(() => {
    const initial = {}
    settingsData.forEach((s) =>
      s.items.forEach((item) => { initial[item.id] = item.defaultOn })
    )
    return initial
  })

  const toggle = (id) => {
    setToggles((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="settings">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Settings</h1>
          <p className="body-md text-muted">
            Manage your clinical workspace preferences and security protocols.
          </p>
        </div>
      </header>

      {settingsData.map((section, si) => (
        <div key={si} className="settings-section">
          <h3 className="title-lg settings-section-title">{section.section}</h3>
          <div className="card settings-card">
            {section.items.map((item, i) => (
              <div key={item.id} className="settings-item" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="settings-item-icon">
                  <span className="material-icons-outlined">{item.icon}</span>
                </div>
                <div className="settings-item-info">
                  <h4 className="title-md">{item.title}</h4>
                  <p className="body-md text-muted">{item.desc}</p>
                </div>
                <div
                  className={`toggle ${toggles[item.id] ? 'active' : ''}`}
                  onClick={() => toggle(item.id)}
                  role="switch"
                  aria-checked={toggles[item.id]}
                  tabIndex={0}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Danger Zone */}
      <div className="settings-section">
        <h3 className="title-lg settings-section-title">Data Purge</h3>
        <div className="card settings-danger-card">
          <div className="settings-danger-content">
            <span className="material-icons-outlined settings-danger-icon">delete_forever</span>
            <div>
              <h4 className="title-md">Permanently delete your local clinical cache</h4>
              <p className="body-md text-muted">
                This action cannot be undone and will logout all sessions.
              </p>
            </div>
          </div>
          <button className="btn btn-danger btn-sm">
            <span className="material-icons-outlined icon-sm">warning</span>
            Purge All Data
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}
