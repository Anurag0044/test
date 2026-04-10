import { useState } from 'react'
import Footer from '../components/Footer'
import './ComparisonPage.css'

const alternatives = [
  { name: 'Dolo 650', maker: 'Micro Labs', price: 10.50, savings: 20.00, pct: 67, stock: 'High' },
  { name: 'P-650 Tablet', maker: 'Talent Healthcare', price: 12.00, savings: 18.50, pct: 61, stock: 'Medium' },
  { name: 'Calpol 650', maker: 'GSK Pharma', price: 15.20, savings: 15.30, pct: 50, stock: 'High' },
  { name: 'Pacimol 650', maker: 'Ipca Labs', price: 8.75, savings: 21.75, pct: 71, stock: 'Low' },
]

export default function ComparisonPage() {
  const [searchTerm, setSearchTerm] = useState('Crocin 650')

  return (
    <div className="comparison">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Comparative Analysis</h1>
          <p className="body-md text-muted">Bioequivalent Matching</p>
        </div>
      </header>

      {/* Search */}
      <div className="comparison-search card">
        <span className="material-icons-outlined">search</span>
        <input
          className="input-field comparison-search-input"
          placeholder="Enter medicine name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="btn btn-primary btn-sm">Analyze</button>
      </div>

      <div className="comparison-layout">
        {/* Source Medicine */}
        <div className="card source-card">
          <div className="source-header">
            <div className="source-icon-wrap">
              <span className="material-icons-outlined">medication</span>
            </div>
            <div>
              <h3 className="headline-sm">Crocin 650</h3>
              <p className="body-md text-muted">Paracetamol • 650mg</p>
            </div>
          </div>
          <div className="source-details">
            <div className="source-detail">
              <span className="label-md text-muted">Usage</span>
              <span className="body-md">Pain Relief & Fever</span>
            </div>
            <div className="source-detail">
              <span className="label-md text-muted">Schedule</span>
              <span className="body-md">Over-the-Counter</span>
            </div>
            <div className="source-detail">
              <span className="label-md text-muted">Availability</span>
              <span className="chip chip-success">High Stock</span>
            </div>
          </div>
          <p className="body-md text-muted source-desc">
            The following alternatives share the exact bio-molecular composition of Paracetamol 650mg.
          </p>
          <div className="source-price">
            <span className="label-md text-muted">Current Market Price</span>
            <span className="display-price">₹30.50</span>
            <span className="body-md text-muted">Reference pricing based on latest pharmaceutical index updates.</span>
          </div>
        </div>

        {/* Alternatives Table */}
        <div className="card alternatives-card">
          <h3 className="title-lg alternatives-title">
            <span className="material-icons-outlined text-primary">verified</span>
            Verified Alternatives
          </h3>
          <div className="alternatives-table">
            <div className="alt-table-header">
              <span>Medicine</span>
              <span>Price</span>
              <span>Savings</span>
              <span>Stock</span>
            </div>
            {alternatives.map((alt, i) => (
              <div key={i} className="alt-table-row" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="alt-name">
                  <h4 className="body-lg" style={{ fontWeight: 600 }}>{alt.name}</h4>
                  <span className="body-md text-muted">{alt.maker}</span>
                </div>
                <span className="title-md">₹{alt.price.toFixed(2)}</span>
                <div className="chip chip-success">
                  Save ₹{alt.savings.toFixed(0)} ({alt.pct}%)
                </div>
                <span className={`chip ${alt.stock === 'Low' ? 'chip-error' : alt.stock === 'Medium' ? 'chip-neutral' : 'chip-success'}`}>
                  {alt.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Advisory */}
      <div className="advisory card card-flat">
        <span className="material-icons-outlined advisory-icon">warning_amber</span>
        <div>
          <h4 className="title-md">Mandatory Medical Advisory</h4>
          <p className="body-md text-muted">
            Consult doctor before switching medicines. While the active ingredients are
            bioequivalent, inactive fillers and binders may vary between manufacturers.
            Ensure you check for specific allergies or sensitivities before making a clinical change.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
