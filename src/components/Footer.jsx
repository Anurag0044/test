import './Footer.css'

export default function Footer({ variant = 'light' }) {
  return (
    <footer className={`footer footer-${variant}`}>
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo-icon">M</div>
          <span className="footer-logo-text">MedIntel</span>
        </div>
        <p className="footer-copy">
          © 2024 MedIntel Clinical Systems. All rights reserved.
        </p>
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">HIPAA Compliance</a>
          <a href="#" className="footer-link">Contact</a>
        </div>
      </div>
    </footer>
  )
}
