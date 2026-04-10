import { useState, useEffect } from 'react'
import Footer from '../components/Footer'
import { getHistory, deleteHistoryEntry, clearHistory as clearAllHistory, getSearchCount } from '../services/historyService'
import './HistoryPage.css'

export default function HistoryPage() {
  const [filter, setFilter] = useState('all')
  const [historyRecords, setHistoryRecords] = useState([])
  const [searchCount, setSearchCount] = useState(0)

  const refreshData = () => {
    setHistoryRecords(getHistory());
    setSearchCount(getSearchCount());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => refreshData();
    window.addEventListener('medintel_history_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('medintel_history_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      clearAllHistory();
    }
  };

  const handleDeleteRecord = (id) => {
    deleteHistoryEntry(id);
  };

  /* Compute total savings from real entries */
  const totalSavings = historyRecords.reduce((sum, r) => {
    const num = parseFloat((r.savings || '').replace(/[^\d.]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  /* Unique categories from real data */
  const categories = ['all', ...new Set(historyRecords.map(r => r.category).filter(Boolean))];

  const filteredRecords = historyRecords.filter(
    (r) => filter === 'all' || r.category === filter
  );

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
            <span className="savings-value">₹{totalSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <p className="body-md text-muted savings-desc">
          Across {searchCount} searches, we've identified cost-reduction
          opportunities while maintaining clinical efficacy.
        </p>
        <div className="savings-meta">
          <div className="chip chip-info">Total Records: {historyRecords.length}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="history-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All Records' : f}
            </button>
          ))}
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClearHistory}
          style={{ borderColor: 'var(--error)', color: 'var(--error)' }}
          disabled={historyRecords.length === 0}
        >
          <span className="material-icons-outlined icon-sm">delete_sweep</span>
          Clear History
        </button>
      </div>

      {/* Records Table */}
      <div className="card history-table-card">
        <div className="history-table-header">
          <span>Medicine</span>
          <span>Category</span>
          <span>Date</span>
          <span>Savings</span>
          <span>Status</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {historyRecords.length === 0 ? (
          <div className="history-empty-state">
            <span className="material-icons-outlined" style={{ fontSize: 40, color: 'var(--outline)' }}>science</span>
            <p className="body-md text-muted" style={{ marginTop: 12 }}>
              No history records yet. Use the <strong>Analyzer</strong> to scan a prescription and your records will appear here.
            </p>
          </div>
        ) : (
          filteredRecords.map((record, i) => (
            <div key={record.id} className="history-table-row" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="history-med">
                <h4 className="body-lg" style={{ fontWeight: 600 }}>{record.name}</h4>
                <span className="body-md text-muted">{record.dose}</span>
              </div>
              <span className="chip chip-neutral">{record.category}</span>
              <span className="body-md text-muted">{record.date}</span>
              <span className="title-md text-primary">{record.savings}</span>
              <span className={`chip ${record.status === 'Verified' ? 'chip-success' : 'chip-info'}`}>
                {record.status}
              </span>
              <div style={{ textAlign: 'right' }}>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => handleDeleteRecord(record.id)}
                  aria-label="Delete record"
                  style={{ color: 'var(--error)' }}
                >
                  <span className="material-icons-outlined">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
        {historyRecords.length > 0 && (
          <div className="history-pagination">
            <span className="body-md text-muted">
              Showing {filteredRecords.length} of {historyRecords.length} records
            </span>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
