import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import './HomePage.css'

const API_BASE = `${import.meta.env.VITE_API_URL}/api/medicines/alternatives`;

/* ── Typewriter hook ── */
function useTypewriter(fullText, {
  typeSpeed = 60,
  deleteSpeed = 35,
  pauseBeforeDelete = 2200,
  pauseBeforeType = 600,
} = {}) {
  const [display, setDisplay] = useState('')
  const [phase, setPhase] = useState('typing') // typing | pausing | deleting | waiting

  useEffect(() => {
    let timer

    if (phase === 'typing') {
      if (display.length < fullText.length) {
        timer = setTimeout(() => {
          setDisplay(fullText.slice(0, display.length + 1))
        }, typeSpeed)
      } else {
        timer = setTimeout(() => setPhase('pausing'), pauseBeforeDelete)
      }
    } else if (phase === 'pausing') {
      setPhase('deleting')
    } else if (phase === 'deleting') {
      if (display.length > 0) {
        timer = setTimeout(() => {
          setDisplay(display.slice(0, -1))
        }, deleteSpeed)
      } else {
        timer = setTimeout(() => setPhase('waiting'), pauseBeforeType)
      }
    } else if (phase === 'waiting') {
      setPhase('typing')
    }

    return () => clearTimeout(timer)
  }, [display, phase, fullText, typeSpeed, deleteSpeed, pauseBeforeDelete, pauseBeforeType])

  const isTyping = phase === 'typing' || phase === 'deleting'
  return { display, isTyping }
}

/* ── Ripple on click ── */
function createRipple(e) {
  const btn = e.currentTarget
  const circle = document.createElement('span')
  const diameter = Math.max(btn.clientWidth, btn.clientHeight)
  const radius = diameter / 2
  const rect = btn.getBoundingClientRect()

  circle.style.width = circle.style.height = `${diameter}px`
  circle.style.left = `${e.clientX - rect.left - radius}px`
  circle.style.top = `${e.clientY - rect.top - radius}px`
  circle.classList.add('btn-ripple')

  // Remove any previous ripple
  const prev = btn.querySelector('.btn-ripple')
  if (prev) prev.remove()

  btn.appendChild(circle)
  // Cleanup after animation
  setTimeout(() => circle.remove(), 700)
}

export default function HomePage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const searchRef = useRef(null)
  const debounceRef = useRef(null)

  const fullHeadline = 'Find Affordable Medicine Alternatives Instantly'
  const { display, isTyping } = useTypewriter(fullHeadline)

  /* Split displayed text to highlight "Alternatives Instantly" portion */
  const highlightStart = 'Find Affordable Medicine '.length
  const beforeHighlight = display.slice(0, Math.min(display.length, highlightStart))
  const highlighted = display.length > highlightStart ? display.slice(highlightStart) : ''

  /* Ripple-enabled click handler */
  const handleBtnClick = useCallback((e, path) => {
    createRipple(e)
    setTimeout(() => navigate(path), 200)
  }, [navigate])

  /* ── Medicine Search ── */
  const searchMedicines = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults(null)
      setSearchError('')
      return
    }
    setSearchLoading(true)
    setSearchError('')
    try {
      const res = await fetch(`${API_BASE}?composition=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (data.success && data.data?.alternatives?.length > 0) {
        setSearchResults(data.data);
      } else {
        setSearchResults(null);
        setSearchError(`No alternatives found for "${query}". Try a composition like paracetamol, amoxicillin...`);
      }
    } catch (err) {
      console.error('Search API error:', err);
      setSearchResults(null);
      setSearchError('Unable to reach the server. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => searchMedicines(val), 600);
    } else {
      setSearchResults(null);
      setSearchError('');
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    searchMedicines(searchQuery);
  };

  /* Close results on outside click */
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        // keep results visible, don't auto-close
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const closeResults = () => {
    setSearchResults(null);
    setSearchError('');
    setSearchQuery('');
  };

  return (
    <div className="home">
      {/* ───── Navbar ───── */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-brand" onClick={() => navigate('/')}>
            <div className="home-nav-logo">M</div>
            <span className="home-nav-name">MedIntel</span>
          </div>

          {/* Desktop links */}
          <div className="home-nav-links">
            <a href="#features" className="home-nav-link">Features</a>
            <a href="#benchmarks" className="home-nav-link">About</a>
            <button className="home-nav-link" style={{background:'none',border:'none',cursor:'pointer'}} onClick={() => navigate('/login')}>Pricing</button>
            <ThemeToggle />
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button
              className="btn btn-primary btn-sm btn-glow"
              onClick={(e) => handleBtnClick(e, '/login')}
            >
              Get Started
            </button>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="home-nav-mobile-actions">
            <ThemeToggle />
            <button
              className={`hamburger ${menuOpen ? 'hamburger-active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div className={`mobile-menu ${menuOpen ? 'mobile-menu-open' : ''}`}>
          <a href="#features" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
            <span className="material-icons-outlined icon-sm">auto_awesome</span>
            Features
          </a>
          <a href="#benchmarks" className="mobile-menu-link" onClick={() => setMenuOpen(false)}>
            <span className="material-icons-outlined icon-sm">info</span>
            About
          </a>
          <div className="mobile-menu-divider" />
          <button className="btn btn-outline mobile-menu-btn" onClick={() => { setMenuOpen(false); navigate('/login') }}>
            Sign In
          </button>
          <button className="btn btn-primary mobile-menu-btn" onClick={() => { setMenuOpen(false); navigate('/login') }}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="hero">
        {/* Radial AI glow behind content */}
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-glow-secondary" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="material-icons-outlined icon-sm">verified</span>
            MedIntel Analysis — Clinical Grade AI
          </div>

          {/* Typewriter headline */}
          <h1 className="hero-title" id="hero-headline" aria-label={fullHeadline}>
            {beforeHighlight}
            {highlighted && (
              <span className="hero-title-accent">{highlighted}</span>
            )}
            <span className={`typewriter-cursor ${isTyping ? 'typing' : ''}`} aria-hidden="true">|</span>
          </h1>

          {/* ── Search Bar ── */}
          <form className={`hero-search ${searchFocused ? 'hero-search-focused' : ''}`} onSubmit={handleSearchSubmit} ref={searchRef}>
            <span className="material-icons-outlined hero-search-icon">search</span>
            <input
              type="text"
              className="hero-search-input"
              id="hero-search-input"
              placeholder='Search medicine (e.g., Paracetamol, Amoxicillin...)'
              value={searchQuery}
              onChange={handleSearchInput}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            {searchLoading && (
              <span className="hero-search-spinner material-icons-outlined">autorenew</span>
            )}
            {searchQuery && !searchLoading && (
              <button type="button" className="hero-search-clear" onClick={closeResults} aria-label="Clear">
                <span className="material-icons-outlined">close</span>
              </button>
            )}
            <button type="submit" className="btn btn-primary btn-sm hero-search-btn" disabled={searchLoading || searchQuery.trim().length < 2}>
              Search
            </button>
          </form>

          {/* ── Search Results ── */}
          {(searchResults || searchError) && (
            <div className="hero-results">
              {searchError && (
                <div className="hero-results-error">
                  <span className="material-icons-outlined">info</span>
                  <p>{searchError}</p>
                </div>
              )}
              {searchResults && (
                <>
                  <div className="hero-results-header">
                    <div className="hero-results-title">
                      <span className="material-icons-outlined" style={{ color: '#22c55e' }}>verified</span>
                      <h3>Found {searchResults.alternatives.length} Alternative{searchResults.alternatives.length !== 1 ? 's' : ''}</h3>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={closeResults}>
                      <span className="material-icons-outlined icon-sm">close</span>
                    </button>
                  </div>

                  {/* Cheapest highlight */}
                  {searchResults.cheapest && (
                    <div className="hero-results-cheapest">
                      <span className="material-icons-outlined">emoji_events</span>
                      <div>
                        <strong>Cheapest: {searchResults.cheapest.name}</strong>
                        <span> — ₹{searchResults.cheapest.price} by {searchResults.cheapest.manufacturer}</span>
                      </div>
                    </div>
                  )}

                  <div className="hero-results-grid">
                    {searchResults.alternatives.slice(0, 8).map((med) => (
                      <div key={med._id} className="hero-result-card">
                        <div className="hero-result-top">
                          <div>
                            <h4 className="hero-result-name">{med.name}</h4>
                            <p className="hero-result-comp">{med.composition}</p>
                          </div>
                          <span className="hero-result-price">₹{med.price}</span>
                        </div>
                        <div className="hero-result-meta">
                          <span className="hero-result-tag">{med.strength}</span>
                          <span className="hero-result-tag">{med.dosageForm}</span>
                          <span className={`hero-result-tag ${med.safetyLevel === 'Safe' ? 'tag-safe' : 'tag-caution'}`}>{med.safetyLevel}</span>
                        </div>
                        <div className="hero-result-bottom">
                          <span className="hero-result-mfr">{med.manufacturer}</span>
                          {med.savingsPercent > 0 && (
                            <span className="hero-result-savings">Save {med.savingsPercent}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="hero-results-disclaimer">
                    <span className="material-icons-outlined icon-sm">info</span>
                    Consult your doctor before switching to an alternative. Prices may vary.
                  </p>
                </>
              )}
            </div>
          )}

          <p className="hero-description">
            Our AI-powered analysis scans thousands of clinical databases to find identical
            compositions at a fraction of the cost. Same efficacy, smarter spending.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg btn-glow"
              id="btn-start-analyzing"
              onClick={(e) => handleBtnClick(e, '/login')}
            >
              <span className="material-icons-outlined">search</span>
              Start Analyzing
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/login')}>
              <span className="material-icons-outlined">bolt</span>
              View Pricing
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">1000+</span>
              <span className="hero-stat-label">Medicine Analyzed</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">300+</span>
              <span className="hero-stat-label">Alternatives Found</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">40%</span>
              <span className="hero-stat-label">Cost Reduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Live Comparison Demo ───── */}
      <section className="demo-section" id="features">
        <div className="demo-section-inner">
          <div className="section-header">
            <h2 className="headline-md">Real-time Comparative Analysis</h2>
            <p className="body-lg text-muted">
              See how MedIntel identifies identical molecular structures to save you money
              without compromising health.
            </p>
          </div>

          <div className="demo-grid">
            {/* Source medicine */}
            <div className="demo-source card card-elevated">
              <div className="demo-source-header">
                <div>
                  <h3 className="title-lg">Crocin 650</h3>
                  <p className="body-md text-muted">Pain Reliever &amp; Fever Reducer</p>
                </div>
                <div className="demo-mrp">
                  <span className="label-md text-muted">MRP</span>
                  <span className="headline-sm text-primary">₹30.50</span>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            <div className="demo-alternatives">
              <div className="demo-alt card">
                <div className="demo-alt-inner">
                  <div className="demo-alt-info">
                    <span className="material-icons-outlined text-success">verified</span>
                    <div>
                      <h4 className="title-md">Dolo 650</h4>
                      <p className="body-md">₹10.50</p>
                    </div>
                  </div>
                  <div className="chip chip-success">
                    Save ₹20 (67%)
                  </div>
                </div>
              </div>
              <div className="demo-alt card">
                <div className="demo-alt-inner">
                  <div className="demo-alt-info">
                    <span className="material-icons-outlined text-success">verified</span>
                    <div>
                      <h4 className="title-md">P-650 Tablet</h4>
                      <p className="body-md">₹12.00</p>
                    </div>
                  </div>
                  <div className="chip chip-success">
                    Save ₹18.50 (61%)
                  </div>
                </div>
              </div>
              <p className="body-md text-muted demo-disclaimer">
                <span className="material-icons-outlined icon-sm">info</span>
                Consult your doctor before switching medications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Value Props ───── */}
      <section className="value-section">
        <div className="value-section-inner">
          <div className="section-header">
            <h2 className="headline-md">Same Molecule, Different Price Tag.</h2>
            <p className="body-lg text-muted">
              Most of the price you pay for common medicines goes towards branding and marketing.
              Generic alternatives use the exact same clinical formula and go through the same
              regulatory approvals.
            </p>
          </div>

          <div className="value-grid">
            <div className="value-card card card-flat">
              <span className="material-icons-outlined value-icon">science</span>
              <h4 className="title-md">Molecular Match</h4>
              <p className="body-md text-muted">
                Every alternative is verified for identical active ingredient concentration.
              </p>
            </div>
            <div className="value-card card card-flat">
              <span className="material-icons-outlined value-icon">savings</span>
              <h4 className="title-md">Annual Savings</h4>
              <p className="body-md text-muted">
                Chronic patients save an average of ₹14,500 annually using MedIntel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Clinical Benchmarks ───── */}
      <section className="benchmarks-section" id="benchmarks">
        <div className="benchmarks-inner">
          <div className="section-header">
            <h2 className="headline-md">The Clinical Benchmark</h2>
            <p className="body-lg text-muted">
              We adhere to global healthcare standards to ensure every recommendation is
              medically sound and legally compliant.
            </p>
          </div>

          <div className="benchmarks-grid">
            <div className="benchmark-card card card-elevated">
              <span className="material-icons-outlined benchmark-icon">biotech</span>
              <h4 className="title-md">Verified Drug Composition</h4>
              <p className="body-md text-muted">
                Our database is cross-referenced with the Central Drugs Standard Control
                Organization (CDSCO) for absolute chemical accuracy.
              </p>
            </div>
            <div className="benchmark-card card card-elevated">
              <span className="material-icons-outlined benchmark-icon">verified_user</span>
              <h4 className="title-md">Regulatory Safe</h4>
              <p className="body-md text-muted">
                Only FDA and WHO approved manufacturing facilities are included in our
                alternative suggestions for your peace of mind.
              </p>
            </div>
            <div className="benchmark-card card card-elevated">
              <span className="material-icons-outlined benchmark-icon">trending_up</span>
              <h4 className="title-md">Transparent Pricing</h4>
              <p className="body-md text-muted">
                Live market price tracking ensures you always see the latest MRP and potential
                savings on every search.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="headline-lg cta-title">Take Control of Your Medical Expenses</h2>
          <p className="body-lg cta-desc">
            Join over 50,000 users who are saving an average of 40% on their monthly pharmacy bills.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg btn-glow"
              id="btn-get-started-cta"
              onClick={(e) => handleBtnClick(e, '/login')}
            >
              Get Started — It's Free
            </button>
            <button
              className="btn btn-outline btn-lg"
              id="btn-view-pricing-cta"
              onClick={(e) => handleBtnClick(e, '/login')}
            >
              <span className="material-icons-outlined">bolt</span>
              View Plans
            </button>
          </div>
        </div>
      </section>

      <Footer variant="dark" />
    </div>
  )
}
