import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { getHistory, getSearchCount } from '../services/historyService'
import './DashboardPage.css'

const uploads = [
  { name: 'RX_Scan_4201.pdf', time: 'Uploaded 2 hours ago', status: 'Verified', icon: 'description' },
  { name: 'Lab_Report_Jan.pdf', time: 'Uploaded 1 day ago', status: 'Pending Analysis', icon: 'pending' },
]

/* Friendly relative time */
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [recentChecks, setRecentChecks] = useState([])
  const [searchCount, setSearchCount] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)

  /* Load from localStorage & listen for updates */
  const refreshData = () => {
    const history = getHistory();
    setRecentChecks(history.slice(0, 5)); // latest 5
    setSearchCount(getSearchCount());

    // Compute total savings from real records
    const savings = history.reduce((sum, r) => {
      const num = parseFloat((r.savings || '').replace(/[^\d.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    setTotalSavings(savings);
  };

  useEffect(() => {
    refreshData();

    // Listen for changes from Analyzer or other tabs
    const handleUpdate = () => refreshData();
    window.addEventListener('medintel_history_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    // Refresh relative timestamps every 30s
    const tick = setInterval(refreshData, 30000);

    return () => {
      window.removeEventListener('medintel_history_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(tick);
    };
  }, []);

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
            <span className="stat-value">₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <span className="stat-label body-md text-muted">Total Procurement Savings</span>
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-icon-wrap stat-icon-secondary">
            <span className="material-icons-outlined">manage_search</span>
          </div>
          <div>
            <span className="stat-value">{searchCount.toLocaleString()}</span>
            <span className="stat-label body-md text-muted">Total Searches</span>
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
            {recentChecks.length === 0 ? (
              <div className="empty-state">
                <span className="material-icons-outlined empty-state-icon">science</span>
                <p className="body-md text-muted">No analyses yet. Upload a prescription to get started!</p>
              </div>
            ) : (
              recentChecks.map((check) => (
                <div key={check.id} className="check-item check-item-enter">
                  <div className="check-item-info">
                    <div className="check-item-icon">
                      <span className="material-icons-outlined">medication</span>
                    </div>
                    <div>
                      <h4 className="body-lg" style={{ fontWeight: 600 }}>{check.name}</h4>
                      <p className="body-md text-muted">
                        {timeAgo(check.timestamp)} • {check.dose}
                        {check.alternatives > 0 && ` • ${check.alternatives} alternative${check.alternatives > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className={`chip ${check.status === 'Verified' ? 'chip-success' : 'chip-info'}`}>
                    {check.status}
                  </div>
                </div>
              ))
            )}
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
