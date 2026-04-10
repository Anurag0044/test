import { useState, useRef } from 'react'
import Footer from '../components/Footer'
import './ComparisonPage.css'

const API_BASE = 'https://medintel-api.onrender.com/api/medicines';

export default function ComparisonPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sourceMedicine, setSourceMedicine] = useState(null)
  const [alternatives, setAlternatives] = useState([])
  const fileInputRef = useRef(null)

  const handleImageSearch = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setSearchTerm('Analyzing image...')
    setError('')
    setSourceMedicine(null)
    setAlternatives([])

    try {
      const apiKey = import.meta.env.VITE_OCR_SPACE_API_KEY
      if (!apiKey) throw new Error('OCR API key missing')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('apikey', apiKey)
      formData.append('language', 'eng')
      formData.append('OCREngine', '2')

      const ocrRes = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      })
      const ocrData = await ocrRes.json()
      const text = ocrData?.ParsedResults?.[0]?.ParsedText || ''
      
      if (!text.trim()) {
        throw new Error('Could not read any text from image.')
      }

      // Extract words and try to find a medicine
      const words = text
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 3)
      
      if (words.length === 0) throw new Error('No medicine names identified in image.')

      // Try searching for the first few words until we find a match
      let foundMed = null
      for (const word of words.slice(0, 5)) {
        const res = await fetch(`${API_BASE}/search?name=${encodeURIComponent(word)}`)
        const data = await res.json()
        if (data.success && data.data?.length > 0) {
          foundMed = data.data[0]
          setSearchTerm(foundMed.name)
          break
        }
      }

      if (!foundMed) {
        throw new Error(`Could not find "${words[0]}" in our pharmaceutical database.`)
      }

      setSourceMedicine(foundMed)
      if (foundMed.composition) {
        const altRes = await fetch(`${API_BASE}/alternatives?composition=${encodeURIComponent(foundMed.composition)}`)
        const altData = await altRes.json()
        if (altData.success && altData.data?.alternatives?.length > 0) {
          setAlternatives(altData.data.alternatives.filter(a => a._id !== foundMed._id))
        }
      }
    } catch (err) {
      console.error('[MedIntel] Image comparison error:', err)
      setError(err.message || 'Image analysis failed.')
      setSearchTerm('')
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleAnalyze = async () => {
    const query = searchTerm.trim()
    if (!query || query.length < 2) {
      setError('Please enter a medicine name (at least 2 characters).')
      return
    }

    setLoading(true)
    setError('')
    setSourceMedicine(null)
    setAlternatives([])

    try {
      // Step 1: Search for the medicine by name
      const searchRes = await fetch(`${API_BASE}/search?name=${encodeURIComponent(query)}`)
      const searchData = await searchRes.json()

      if (!searchData.success || !searchData.data?.length) {
        setError(`No medicine found matching "${query}". Try names like Crocin, Dolo, Combiflam...`)
        setLoading(false)
        return
      }

      // Take the best match (first result)
      const medicine = searchData.data[0]
      setSourceMedicine(medicine)

      // Step 2: Fetch alternatives using the medicine's composition
      if (medicine.composition) {
        const altRes = await fetch(`${API_BASE}/alternatives?composition=${encodeURIComponent(medicine.composition)}`)
        const altData = await altRes.json()

        if (altData.success && altData.data?.alternatives?.length > 0) {
          // Exclude the source medicine itself
          const filtered = altData.data.alternatives.filter(a => a._id !== medicine._id)
          setAlternatives(filtered)
        }
      }
    } catch (err) {
      console.error('[MedIntel] Comparison error:', err)
      setError('Unable to reach the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAnalyze()
  }

  // Determine stock level based on safety
  const getStockChip = (safetyLevel) => {
    if (safetyLevel === 'Safe') return { label: 'Available', cls: 'chip-success' }
    return { label: 'Rx Only', cls: 'chip-neutral' }
  }

  return (
    <div className="comparison">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Comparative Analysis</h1>
          <p className="body-md text-muted">Bioequivalent Matching — Powered by MedIntel API</p>
        </div>
      </header>

      {/* Search */}
      <div className="comparison-search card">
        <span className="material-icons-outlined">search</span>
        <input
          className="input-field comparison-search-input"
          placeholder="Enter medicine name (e.g., Crocin, Dolo, Combiflam...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageSearch} 
        />
        
        <button 
          className="icon-btn-secondary" 
          onClick={() => fileInputRef.current?.click()}
          title="Analyze from Image"
          disabled={loading}
        >
          <span className="material-icons-outlined">photo_camera</span>
        </button>

        <button
          className="btn btn-primary btn-sm"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Analyze'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="comparison-error">
          <span className="material-icons-outlined">info</span>
          <p>{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="comparison-loading">
          <div className="loading-spinner-wrap">
            <span className="material-icons-outlined loading-spin">autorenew</span>
          </div>
          <p className="body-md text-muted">Searching MedIntel database...</p>
        </div>
      )}

      {/* Results */}
      {sourceMedicine && !loading && (
        <div className="comparison-layout animate-fade-in">
          {/* Source Medicine */}
          <div className="card source-card">
            <div className="source-header">
              <div className="source-icon-wrap">
                <span className="material-icons-outlined">medication</span>
              </div>
              <div>
                <h3 className="headline-sm">{sourceMedicine.name}</h3>
                <p className="body-md text-muted">{sourceMedicine.composition} • {sourceMedicine.strength}</p>
              </div>
            </div>
            <div className="source-details">
              <div className="source-detail">
                <span className="label-md text-muted">Usage</span>
                <span className="body-md">{sourceMedicine.usage || 'General'}</span>
              </div>
              <div className="source-detail">
                <span className="label-md text-muted">Schedule</span>
                <span className="body-md">{sourceMedicine.classification || 'N/A'}</span>
              </div>
              <div className="source-detail">
                <span className="label-md text-muted">Category</span>
                <span className="body-md">{sourceMedicine.category || 'N/A'}</span>
              </div>
              <div className="source-detail">
                <span className="label-md text-muted">Manufacturer</span>
                <span className="body-md">{sourceMedicine.manufacturer || 'N/A'}</span>
              </div>
              <div className="source-detail">
                <span className="label-md text-muted">Safety</span>
                <span className={`chip ${sourceMedicine.safetyLevel === 'Safe' ? 'chip-success' : 'chip-neutral'}`}>
                  {sourceMedicine.safetyLevel || 'Check'}
                </span>
              </div>
            </div>

            {/* Side Effects */}
            {sourceMedicine.sideEffects?.length > 0 && (
              <div className="source-side-effects">
                <span className="label-md text-muted">Side Effects</span>
                <div className="side-effects-list">
                  {sourceMedicine.sideEffects.map((se, i) => (
                    <span key={i} className="side-effect-chip">{se}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="body-md text-muted source-desc">
              The following alternatives share the same active composition: {sourceMedicine.composition}.
            </p>
            <div className="source-price">
              <span className="label-md text-muted">Current Market Price</span>
              <span className="display-price">₹{sourceMedicine.price}</span>
              <span className="body-md text-muted">Per {sourceMedicine.dosageForm || 'unit'} • {sourceMedicine.strength}</span>
            </div>
          </div>

          {/* Alternatives Table */}
          <div className="card alternatives-card">
            <h3 className="title-lg alternatives-title">
              <span className="material-icons-outlined text-primary">verified</span>
              Verified Alternatives ({alternatives.length})
            </h3>

            {alternatives.length > 0 ? (
              <div className="alternatives-table">
                <div className="alt-table-header">
                  <span>Medicine</span>
                  <span>Price</span>
                  <span>Savings</span>
                  <span>Status</span>
                </div>
                {alternatives.map((alt, i) => {
                  const savings = sourceMedicine.price - alt.price
                  const pct = sourceMedicine.price > 0 ? Math.round((savings / sourceMedicine.price) * 100) : 0
                  const stock = getStockChip(alt.safetyLevel)

                  return (
                    <div key={alt._id || i} className="alt-table-row" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="alt-name">
                        <h4 className="body-lg" style={{ fontWeight: 600 }}>{alt.name}</h4>
                        <span className="body-md text-muted">{alt.manufacturer}</span>
                      </div>
                      <span className="title-md">₹{alt.price.toFixed(2)}</span>
                      {savings > 0 ? (
                        <div className="chip chip-success">
                          Save ₹{savings.toFixed(0)} ({pct}%)
                        </div>
                      ) : (
                        <div className="chip chip-neutral">
                          {savings === 0 ? 'Same' : `+₹${Math.abs(savings).toFixed(0)}`}
                        </div>
                      )}
                      <span className={`chip ${stock.cls}`}>{stock.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="no-alternatives">
                <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--outline)' }}>search_off</span>
                <p className="body-md text-muted">No alternatives found for this composition.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State — before search */}
      {!sourceMedicine && !loading && !error && (
        <div className="comparison-empty">
          <span className="material-icons-outlined" style={{ fontSize: '56px', color: 'var(--primary)', opacity: 0.6 }}>compare_arrows</span>
          <h3 className="title-lg">Search & Compare Medicines</h3>
          <p className="body-md text-muted" style={{ maxWidth: '420px' }}>
            Enter a medicine name above to find verified alternatives with the same composition at lower prices.
          </p>
          <div className="comparison-suggestions">
            {['Crocin', 'Dolo', 'Combiflam', 'Zerodol', 'Flexon'].map(name => (
              <button
                key={name}
                className="suggestion-chip"
                onClick={() => { setSearchTerm(name); }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

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
