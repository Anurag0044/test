import Footer from '../components/Footer'
import './ProfilePage.css'

const prescriptions = [
  { name: 'Donepezil 10mg', patient: 'Mr. Arthur Miller', date: 'Oct 22, 2023', status: 'Active' },
  { name: 'Memantine 20mg XR', patient: 'Mrs. Elena Rodriguez', date: 'Oct 20, 2023', status: 'Active' },
  { name: 'Sertraline 50mg', patient: 'James K. Peterson', date: 'Oct 18, 2023', status: 'Completed' },
]

export default function ProfilePage() {
  return (
    <div className="profile">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Profile</h1>
        </div>
      </header>

      {/* Profile Header Card */}
      <div className="card profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div className="profile-avatar-lg">
            <span className="profile-avatar-text">SJ</span>
          </div>
          <div className="profile-hero-info">
            <h2 className="headline-sm">Dr. Sarah Jenkins</h2>
            <p className="body-md text-muted">Neurology</p>
          </div>
          <button className="btn btn-outline btn-sm profile-edit-btn">
            <span className="material-icons-outlined icon-sm">edit</span>
            Edit Profile
          </button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Details */}
        <div className="card profile-details-card">
          <h3 className="title-lg profile-section-title">Profile Details</h3>
          <div className="profile-details-list">
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">person</span>
              <div>
                <span className="label-md text-muted">Full Name</span>
                <span className="body-lg">Sarah Jenkins, M.D.</span>
              </div>
            </div>
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">email</span>
              <div>
                <span className="label-md text-muted">Email</span>
                <span className="body-lg">s.jenkins@medintel.org</span>
              </div>
            </div>
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">local_hospital</span>
              <div>
                <span className="label-md text-muted">Department</span>
                <span className="body-lg">Neurology & Cognitive Sciences</span>
              </div>
            </div>
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">badge</span>
              <div>
                <span className="label-md text-muted">License ID</span>
                <span className="body-lg">#NY-88294-B</span>
              </div>
            </div>
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">circle</span>
              <div>
                <span className="label-md text-muted">Status</span>
                <span className="chip chip-success">Active</span>
              </div>
            </div>
            <div className="profile-detail-row">
              <span className="material-icons-outlined icon-sm text-muted">login</span>
              <div>
                <span className="label-md text-muted">Last Login</span>
                <span className="body-lg">Oct 24, 2024 — 08:14 AM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Prescriptions */}
        <div className="card profile-prescriptions-card">
          <h3 className="title-lg profile-section-title">Saved Prescriptions</h3>
          <p className="body-md text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Recent clinical orders and digital prescriptions
          </p>
          <div className="prescriptions-list">
            {prescriptions.map((rx, i) => (
              <div key={i} className="prescription-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="prescription-icon">
                  <span className="material-icons-outlined">description</span>
                </div>
                <div className="prescription-info">
                  <h4 className="body-lg" style={{ fontWeight: 600 }}>{rx.name}</h4>
                  <p className="body-md text-muted">Patient: {rx.patient}</p>
                  <p className="body-md text-muted">{rx.date}</p>
                </div>
                <span className={`chip ${rx.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                  {rx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
