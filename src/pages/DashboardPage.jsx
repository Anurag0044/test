import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import './DashboardPage.css'

const recentChecks = [
  { name: 'Amoxicillin Clavulanate', date: 'Oct 24, 2023', doctor: 'Dr. Richards', status: 'Verified', statusType: 'success' },
  { name: 'Warfarin Sodium (Coumadin)', date: 'Oct 23, 2023', doctor: 'Dr. Chen', status: 'Review', statusType: 'info' },
  { name: 'Metformin 500mg', date: 'Oct 23, 2023', doctor: 'Dr. Sarah Chen', status: 'Verified', statusType: 'success' },
]

const uploads = [
  { name: 'RX_Scan_4201.pdf', time: 'Uploaded 2 hours ago', status: 'Verified', icon: 'description' },
  { name: 'Lab_Report_Jan.pdf', time: 'Uploaded 1 day ago', status: 'Pending Analysis', icon: 'pending' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="headline-md">Dashboard</h1>
          <p className="body-md text-muted">
            Analyze drug interactions and clinical efficacy in real-time.
          </p>
        </div>
        <div className="page-header-actions">
          <div className="search-bar">
            <span className="material-icons-outlined icon-sm">search</span>
            <input className="input-field" placeholder="Search medicines, reports..." />
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/app/analyzer')}>
            <span className="material-icons-outlined icon-sm">add</span>
            New Analysis
          </button>
        </div>
      </header>

      {/* Quick Tip */}
      <div className="dashboard-tip">
        <span className="material-icons-outlined">lightbulb</span>
        <div>
          <strong>Quick Tip</strong>
          <p className="body-md">"Uploading a scanned prescription allows for automatic contraindication checks against patient history."</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-card card">
          <div className="stat-icon-wrap stat-icon-primary">
            <span className="material-icons-outlined">savings</span>
          </div>
          <div>
            <span className="stat-value">$12,482</span>
            <span className="stat-label body-md text-muted">Total Procurement Savings</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-wrap stat-icon-secondary">
            <span className="material-icons-outlined">manage_search</span>
          </div>
          <div>
            <span className="stat-value">1,240</span>
            <span className="stat-label body-md text-muted">Recent Searches</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-wrap stat-icon-success">
            <span className="material-icons-outlined">verified</span>
          </div>
          <div>
            <span className="stat-value">99.9%</span>
            <span className="stat-label body-md text-muted">Clinical Accuracy</span>
          </div>
        </div>
      </div>

      {/* System Integrity Banner */}
      <div className="integrity-banner">
        <div className="integrity-dot" />
        <span className="body-md">System Integrity</span>
        <span className="chip chip-success">Live • 99.9% Clinical Accuracy</span>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Recent Medicine Checks */}
        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="title-lg">Recent Medicine Checks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/history')}>
              View History
              <span className="material-icons-outlined icon-sm">arrow_forward</span>
            </button>
          </div>
          <div className="checks-list">
            {recentChecks.map((check, i) => (
              <div key={i} className="check-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="check-item-info">
                  <div className="check-item-icon">
                    <span className="material-icons-outlined">medication</span>
                  </div>
                  <div>
                    <h4 className="body-lg" style={{ fontWeight: 600 }}>{check.name}</h4>
                    <p className="body-md text-muted">Check Date: {check.date} • {check.doctor}</p>
                  </div>
                </div>
                <div className={`chip chip-${check.statusType}`}>
                  {check.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prescription Uploads */}
        <div className="card dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="title-lg">Prescription Uploads</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/analyzer')}>
              Upload New
              <span className="material-icons-outlined icon-sm">upload</span>
            </button>
          </div>
          <div className="uploads-list">
            {uploads.map((upload, i) => (
              <div key={i} className="upload-item">
                <div className="upload-item-info">
                  <span className="material-icons-outlined upload-icon">{upload.icon}</span>
                  <div>
                    <h4 className="body-lg" style={{ fontWeight: 600 }}>{upload.name}</h4>
                    <p className="body-md text-muted">{upload.time} • {upload.status}</p>
                  </div>
                </div>
                <span className="material-icons-outlined text-muted">more_vert</span>
              </div>
            ))}
          </div>

          {/* Pro Card */}
          <div className="pro-card">
            <div className="pro-card-content">
              <span className="material-icons-outlined pro-icon">auto_awesome</span>
              <div>
                <h4 className="title-md">MedIntel AI Pro</h4>
                <p className="body-md" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Unlock deep pharmacokinetics analysis and predictive interaction modelling.
                </p>
              </div>
            </div>
            <button className="btn btn-sm pro-btn">Upgrade Now</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
