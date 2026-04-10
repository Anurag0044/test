import { useState } from 'react'
import Footer from '../components/Footer'
import './AnalyzerPage.css'

const extractionResults = [
  {
    name: 'Amoxicillin Trihydrate',
    dose: '500 mg',
    instructions: 'Take one capsule by mouth three times daily (every 8 hours) for 7 consecutive days. Complete the entire course regardless of symptom improvement.',
  },
  {
    name: 'Lisinopril Tablets',
    dose: '10 mg',
    instructions: 'Take one tablet once daily at the same time each morning. Avoid potassium-rich supplements unless directed by a physician.',
  },
]

const recentAnalyses = [
  { title: 'Dermatology Scan', desc: 'Analysis of topical steroid prescription for patient #MI-0922...', time: '2 hours ago', icon: 'dermatology' },
  { title: 'Cardiology Refill', desc: 'Potential drug interaction detected between Lisinopril and recent NSAID use...', time: '5 hours ago', icon: 'cardiology' },
  { title: 'Pediatric Intake', desc: 'Digitization of immunization records and weight-based dosage charts...', time: '1 day ago', icon: 'child_care' },
]

export default function AnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [uploaded, setUploaded] = useState(false)

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    setUploaded(true)
  }

  return (
    <div className="analyzer">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Prescription Analyzer</h1>
          <p className="body-md text-muted">
            Upload a handwritten or digital prescription to extract clinical data with AI precision.
          </p>
        </div>
      </header>

      <div className="analyzer-grid">
        {/* Upload Zone */}
        <div className="analyzer-left">
          <div
            className={`upload-zone card ${isDragging ? 'upload-zone-active' : ''} ${uploaded ? 'upload-zone-done' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploaded ? (
              <div className="upload-done">
                <span className="material-icons-outlined upload-done-icon">check_circle</span>
                <h3 className="title-lg">Prescription Processed</h3>
                <p className="body-md text-muted">AI extraction complete. Results shown below.</p>
                <button className="btn btn-outline btn-sm" onClick={() => setUploaded(false)}>
                  Upload Another
                </button>
              </div>
            ) : (
              <>
                <span className="material-icons-outlined upload-zone-icon">cloud_upload</span>
                <h3 className="title-lg">Drop prescription here</h3>
                <p className="body-md text-muted">Support JPG, PNG, and PDF formats up to 10MB</p>
                <button className="btn btn-primary btn-sm" onClick={() => setUploaded(true)}>
                  Browse Files
                </button>
              </>
            )}
          </div>

          <div className="hipaa-notice">
            <span className="material-icons-outlined icon-sm">shield</span>
            <div>
              <strong>HIPAA Compliant Processing</strong>
              <p className="body-md text-muted">
                All data is encrypted and automatically redacted after analysis.
              </p>
            </div>
          </div>
        </div>

        {/* Extraction Results */}
        <div className="analyzer-right">
          <div className="card extraction-card">
            <h3 className="title-lg extraction-title">
              <span className="material-icons-outlined text-primary">auto_awesome</span>
              Extraction Results
            </h3>
            <div className="extraction-list">
              {extractionResults.map((med, i) => (
                <div key={i} className="extraction-item">
                  <div className="extraction-item-header">
                    <h4 className="title-md">{med.name}</h4>
                    <span className="chip chip-info">{med.dose}</span>
                  </div>
                  <p className="body-md text-muted">{med.instructions}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Clinical Analyses */}
      <div className="recent-analyses">
        <h3 className="title-lg" style={{ marginBottom: 'var(--space-5)' }}>Recent Clinical Analyses</h3>
        <div className="analyses-grid">
          {recentAnalyses.map((item, i) => (
            <div key={i} className="card analysis-card" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="analysis-icon-wrap">
                <span className="material-icons-outlined">{item.icon}</span>
              </div>
              <h4 className="title-md">{item.title}</h4>
              <p className="body-md text-muted">{item.desc}</p>
              <span className="body-md text-muted analysis-time">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  )
}
