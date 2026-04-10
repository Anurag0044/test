import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import Footer from '../components/Footer'
import './HomePage.css'

export default function HomePage() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

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
            <ThemeToggle />
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/login')}>
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
        <div className="hero-content">
          <div className="hero-badge">
            <span className="material-icons-outlined icon-sm">verified</span>
            MedIntel Analysis — Clinical Grade AI
          </div>
          <h1 className="hero-title">
            Find Affordable Medicine<br />
            <span className="hero-title-accent">Alternatives Instantly</span>
          </h1>
          <p className="hero-description">
            Our AI-powered analysis scans thousands of clinical databases to find identical
            compositions at a fraction of the cost. Same efficacy, smarter spending.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
              <span className="material-icons-outlined">search</span>
              Start Analyzing
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('#features')}>
              Learn More
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">50K+</span>
              <span className="hero-stat-label">Active Users</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">₹14,500</span>
              <span className="hero-stat-label">Avg. Annual Savings</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">98.2%</span>
              <span className="hero-stat-label">Match Accuracy</span>
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
                  <p className="body-md text-muted">Pain Reliever & Fever Reducer</p>
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
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/login')}>
            Get Started — It's Free
          </button>
        </div>
      </section>

      <Footer variant="dark" />
    </div>
  )
}
