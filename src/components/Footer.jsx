import { useEffect, useRef, useState } from 'react'
import './Footer.css'

export default function Footer({ variant = 'light' }) {
  const footerRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  /* Fade-in when footer enters viewport */
  useEffect(() => {
    const el = footerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <footer
      ref={footerRef}
      className={`footer footer-${variant} ${isVisible ? 'footer-visible' : ''}`}
    >
      {/* Green glow behind footer */}
      <div className="footer-glow" aria-hidden="true" />

      <div className="footer-inner">
        {/* Left: Logo + Brand */}
        <div className="footer-brand">
          <div className="footer-logo-icon">M</div>
          <span className="footer-logo-text">MedIntel</span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="footer-links" aria-label="Footer navigation">
          <a href="#" className="footer-link">Privacy Policy</a>
          <a href="#" className="footer-link">Terms of Service</a>
          <a href="#" className="footer-link">HIPAA Compliance</a>
          <a href="#" className="footer-link">Contact</a>
        </nav>

        {/* Right: Tagline */}
        <p className="footer-tagline">
          AI-powered healthcare platform
        </p>
      </div>

      {/* Bottom copyright */}
      <div className="footer-bottom">
        <p className="footer-copy">
          © {new Date().getFullYear()} MedIntel Clinical Systems. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
