import { useState } from 'react'
import './PharmacyPage.css'

const pharmacies = [
  { name: 'Central Clinical Pharmacy', address: '123 Medical Center Blvd, Suite 100', distance: '0.3 mi', hours: '24/7', phone: '(555) 234-5678', status: 'open', rating: 4.8 },
  { name: 'Harbor Medical Center', address: '456 Harbor Drive, Wing B', distance: '1.2 mi', hours: '8AM - 10PM', phone: '(555) 345-6789', status: 'open', rating: 4.6 },
  { name: 'Northside Apothecary', address: '789 North Ave, Floor 2', distance: '2.1 mi', hours: '9AM - 9PM', phone: '(555) 456-7890', status: 'open', rating: 4.7 },
  { name: 'Wellness Way Pharmacy', address: '321 Wellness Parkway', distance: '3.4 mi', hours: '8AM - 8PM', phone: '(555) 567-8901', status: 'closing', rating: 4.3 },
  { name: 'Metropolitan Drugs', address: '654 Metro Square, Unit 5', distance: '4.8 mi', hours: '10AM - 6PM', phone: '(555) 678-9012', status: 'closed', rating: 4.1 },
]

export default function PharmacyPage() {
  const [selected, setSelected] = useState(0)

  return (
    <div className="pharmacy">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Pharmacy Locator</h1>
          <p className="body-md text-muted">{pharmacies.length * 8 + 2} facilities found nearby</p>
        </div>
        <div className="page-header-actions">
          <div className="search-bar">
            <span className="material-icons-outlined icon-sm">search</span>
            <input className="input-field" placeholder="Search pharmacies..." />
          </div>
        </div>
      </header>

      <div className="pharmacy-layout">
        {/* List */}
        <div className="pharmacy-list">
          {pharmacies.map((p, i) => (
            <div
              key={i}
              className={`card pharmacy-card ${selected === i ? 'pharmacy-card-active' : ''}`}
              onClick={() => setSelected(i)}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="pharmacy-card-header">
                <h4 className="title-md">{p.name}</h4>
                <div className={`pharmacy-status pharmacy-status-${p.status}`}>
                  <div className="pharmacy-status-dot" />
                  <span className="label-sm">{p.status === 'open' ? 'Open' : p.status === 'closing' ? 'Closing Soon' : 'Closed'}</span>
                </div>
              </div>
              <p className="body-md text-muted">{p.address}</p>
              <div className="pharmacy-card-meta">
                <span className="body-md">
                  <span className="material-icons-outlined icon-sm">place</span>
                  {p.distance}
                </span>
                <span className="body-md">
                  <span className="material-icons-outlined icon-sm">schedule</span>
                  {p.hours}
                </span>
                <span className="body-md">
                  <span className="material-icons-outlined icon-sm">star</span>
                  {p.rating}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail / Map Placeholder */}
        <div className="pharmacy-detail card">
          <div className="pharmacy-map-placeholder">
            <span className="material-icons-outlined pharmacy-map-icon">map</span>
            <p className="body-md text-muted">Interactive map view</p>
          </div>
          <div className="pharmacy-detail-info">
            <h3 className="headline-sm">{pharmacies[selected].name}</h3>
            <p className="body-md text-muted">{pharmacies[selected].address}</p>
            <div className="pharmacy-detail-row">
              <span className="material-icons-outlined icon-sm text-primary">call</span>
              <span className="body-md">{pharmacies[selected].phone}</span>
            </div>
            <div className="pharmacy-detail-row">
              <span className="material-icons-outlined icon-sm text-primary">schedule</span>
              <span className="body-md">{pharmacies[selected].hours}</span>
            </div>
            <div className="pharmacy-detail-actions">
              <button className="btn btn-primary">
                <span className="material-icons-outlined icon-sm">directions</span>
                Get Directions
              </button>
              <button className="btn btn-outline">
                <span className="material-icons-outlined icon-sm">call</span>
                Call Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
