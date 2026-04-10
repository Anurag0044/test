import { useState } from 'react'
import Footer from '../components/Footer'
import './HistoryPage.css'

const records = [
  { name: 'Atorvastatin (Lipitor)', dose: '80mg Oral Tablet', date: 'Oct 24, 2023', savings: '$842.00', status: 'Optimized', category: 'Cardiovascular' },
  { name: 'Adalimumab (Humira)', dose: '40mg/0.4mL Injection', date: 'Oct 22, 2023', savings: '$4,200.00', status: 'Optimized', category: 'Immunology' },
  { name: 'Metformin HCl', dose: '500mg Extended Release', date: 'Oct 20, 2023', savings: '$320.50', status: 'Optimized', category: 'Endocrine' },
  { name: 'Empagliflozin (Jardiance)', dose: '25mg Daily', date: 'Oct 18, 2023', savings: '$1,890.00', status: 'Review', category: 'Endocrine' },
  { name: 'Lisinopril', dose: '10mg Tablet', date: 'Oct 15, 2023', savings: '$125.00', status: 'Optimized', category: 'Cardiovascular' },
]

export default function HistoryPage() {
  const [filter, setFilter] = useState('all')

  return (
    <div className="history">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Patient Records</h1>
          <p className="body-md text-muted">
            Complete historical log of therapeutic comparisons and financial optimization
            strategies generated within the clinical portal.
          </p>
        </div>
      </header>

      {/* Savings Summary */}
      <div className="savings-banner card card-elevated">
        <div className="savings-info">
          <span className="material-icons-outlined savings-icon">account_balance_wallet</span>
          <div>
            <span className="label-md text-muted">Total Clinical Savings</span>
            <span className="savings-value">$14,282.50</span>
          </div>
        </div>
        <p className="body-md text-muted savings-desc">
          Across 142 optimization reports, we've identified significant cost-reduction
          opportunities while maintaining clinical efficacy.
        </p>
        <div className="savings-meta">
          <div className="chip chip-info">Total Records: 842</div>
        </div>
      </div>

      {/* Filters */}
      <div className="history-filters">
        {['all', 'Cardiovascular', 'Endocrine', 'Immunology'].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All Records' : f}
          </button>
        ))}
      </div>

      {/* Records Table */}
      <div className="card history-table-card">
        <div className="history-table-header">
          <span>Medicine</span>
          <span>Category</span>
          <span>Date</span>
          <span>Savings</span>
          <span>Status</span>
        </div>
        {records
          .filter((r) => filter === 'all' || r.category === filter)
          .map((record, i) => (
            <div key={i} className="history-table-row" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="history-med">
                <h4 className="body-lg" style={{ fontWeight: 600 }}>{record.name}</h4>
                <span className="body-md text-muted">{record.dose}</span>
              </div>
              <span className="chip chip-neutral">{record.category}</span>
              <span className="body-md text-muted">{record.date}</span>
              <span className="title-md text-primary">{record.savings}</span>
              <span className={`chip ${record.status === 'Optimized' ? 'chip-success' : 'chip-info'}`}>
                {record.status}
              </span>
            </div>
          ))}
        <div className="history-pagination">
          <span className="body-md text-muted">Showing 1 to 5 of 842 records</span>
          <div className="pagination-btns">
            <button className="btn btn-ghost btn-sm" disabled>Previous</button>
            <button className="btn btn-ghost btn-sm">Next</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
