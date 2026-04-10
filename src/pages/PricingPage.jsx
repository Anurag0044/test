import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { initiatePayment, getUserSubscription, PLANS } from '../services/razorpayService'
import Footer from '../components/Footer'
import './PricingPage.css'

/* ── FAQ data ── */
const FAQS = [
  {
    q: 'Is my payment information secure?',
    a: 'Yes. All payments are processed securely by Razorpay — a PCI DSS Level 1 certified payment gateway. MedIntel never stores your card details.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Absolutely. You can cancel at any time from your Profile settings. Your plan remains active until the end of your billing period.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your analysis history is retained for 90 days after downgrading. You can export all your data in PDF or CSV format before cancelling.',
  },
  {
    q: 'Do you offer a free trial for Pro?',
    a: 'Yes! New accounts automatically get a 7-day Pro trial. No credit card required to start.',
  },
  {
    q: 'Is there a discount for annual billing?',
    a: 'Yes — switching to annual billing saves you 2 months (16.7% off). The annual price is charged upfront.',
  },
]

/* ── Plan definitions ── */
const FREE_FEATURES = [
  { text: '5 medicine analyses/month', included: true },
  { text: 'Basic drug alternatives', included: true },
  { text: 'AI chatbot (10 queries/day)', included: true },
  { text: 'Advanced pharmacokinetics', included: false },
  { text: 'Predictive drug interactions', included: false },
  { text: 'Export PDF reports', included: false },
  { text: 'Priority support', included: false },
]

const PRO_FEATURES = [
  { text: 'Unlimited medicine analyses', included: true },
  { text: 'Advanced AI pharmacokinetics', included: true },
  { text: 'Predictive drug interactions', included: true },
  { text: 'Bulk prescription upload', included: true },
  { text: 'Export PDF & CSV reports', included: true },
  { text: 'Custom drug watchlists', included: true },
  { text: 'Priority 24/7 support', included: true },
]

const ELITE_FEATURES = [
  { text: 'Everything in Pro', included: true },
  { text: 'Multi-user team access (25)', included: true },
  { text: 'EHR / EMR integration', included: true },
  { text: 'White-label reports', included: true },
  { text: 'Advanced analytics dashboard', included: true },
  { text: 'HIPAA-ready data export', included: true },
  { text: 'Custom API access', included: true },
  { text: 'Dedicated account manager', included: true },
]

/* ── FAQ Item ── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-item ${open ? 'faq-open' : ''}`}>
      <button
        className="faq-question-btn"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {q}
        <span className="material-icons-outlined faq-chevron">expand_more</span>
      </button>
      <div className="faq-answer" aria-hidden={!open}>
        <div className="faq-answer-inner">{a}</div>
      </div>
    </div>
  )
}

/* ── Success Modal ── */
function SuccessModal({ paymentId, planName, onClose }) {
  const navigate = useNavigate()
  return (
    <div className="payment-modal-overlay" role="dialog" aria-modal="true">
      <div className="payment-modal">
        <div className="modal-success-icon">
          <span className="material-icons-outlined">verified</span>
        </div>
        <h2 className="modal-title">Welcome to {planName}! 🎉</h2>
        <p className="modal-subtitle">
          Your subscription is now active. All premium features are unlocked.
        </p>
        {paymentId && (
          <div className="modal-payment-id">
            <strong>Payment ID:</strong> {paymentId}
          </div>
        )}
        <button
          className="btn btn-primary btn-glow"
          style={{ width: '100%', padding: '14px' }}
          onClick={() => { onClose(); navigate('/app/dashboard') }}
          id="modal-go-to-dashboard"
        >
          <span className="material-icons-outlined">dashboard</span>
          Go to Dashboard
        </button>
      </div>
    </div>
  )
}

/* ── Main PricingPage ── */
export default function PricingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [annual, setAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(null) // 'pro' | 'elite'
  const [subscription, setSubscription] = useState(null)
  const [successInfo, setSuccessInfo] = useState(null)   // { planId, paymentId }
  const [errorMsg, setErrorMsg] = useState(null)

  const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID

  /* Fetch current subscription */
  useEffect(() => {
    if (user?.uid) {
      getUserSubscription(user.uid)
        .then(setSubscription)
        .catch(console.error)
    }
  }, [user])

  /* Auto-dismiss error toast */
  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(null), 4500)
    return () => clearTimeout(t)
  }, [errorMsg])

  /* Compute displayed price (annual = 10 months price) */
  function displayPrice(planId) {
    const plan = PLANS[planId]
    if (!plan) return '0'
    const baseMonthly = plan.price / 100
    if (annual) {
      const annualMonthly = Math.round((baseMonthly * 10) / 12)
      return `₹${annualMonthly}`
    }
    return plan.displayPrice
  }

  function annualTotal(planId) {
    const plan = PLANS[planId]
    if (!plan) return ''
    const baseMonthly = plan.price / 100
    return `₹${Math.round(baseMonthly * 10)}/year (save ₹${Math.round(baseMonthly * 2)})`
  }

  /* Handle payment */
  const handleUpgrade = useCallback(async (planId) => {
    if (!user) {
      navigate('/login')
      return
    }
    setLoadingPlan(planId)
    await initiatePayment({
      planId,
      user,
      razorpayKey: RAZORPAY_KEY,
      onSuccess: ({ planId: pid, paymentId }) => {
        setSubscription({ planId: pid, status: 'active' })
        setSuccessInfo({ planId: pid, paymentId })
        setLoadingPlan(null)
      },
      onError: (err) => {
        if (err.message !== 'Payment cancelled') {
          setErrorMsg(err.message || 'Payment failed. Please try again.')
        }
        setLoadingPlan(null)
      },
    })
  }, [user, navigate, RAZORPAY_KEY])

  /* Determine button state for a plan */
  function planButtonState(planId) {
    if (subscription?.planId === planId && subscription?.status === 'active') {
      return 'current'
    }
    if (loadingPlan === planId) return 'loading'
    return 'idle'
  }

  return (
    <div className="pricing-page">
      {/* Aurora background */}
      <div className="pricing-aurora" aria-hidden="true" />

      {/* ── Hero ── */}
      <section className="pricing-hero">
        <div className="pricing-badge">
          <span className="material-icons-outlined">auto_awesome</span>
          Upgrade MedIntel — Clinical AI, Unleashed
        </div>
        <h1 className="pricing-hero-title">
          Choose the Plan That <span className="accent">Fits Your Practice</span>
        </h1>
        <p className="pricing-hero-subtitle">
          From individual patients to large healthcare enterprises — MedIntel has a plan built for every scale of clinical need.
        </p>

        {/* Billing toggle */}
        <div className="billing-toggle-wrap">
          <span>Monthly</span>
          <button
            className={`billing-toggle ${annual ? 'annual' : ''}`}
            onClick={() => setAnnual(!annual)}
            role="switch"
            aria-checked={annual}
            id="billing-annual-toggle"
            aria-label="Toggle annual billing"
          />
          <span>Annual</span>
          {annual && (
            <span className="billing-save-chip">Save 17%</span>
          )}
        </div>
      </section>

      {/* ── Plans Grid ── */}
      <div className="plans-grid">

        {/* ── FREE Plan ── */}
        <div className="plan-card plan-free">
          <div className="plan-header">
            <div className="plan-icon-wrap icon-free">
              <span className="material-icons-outlined" style={{ color: 'var(--outline)' }}>
                person
              </span>
            </div>
            <div className="plan-name">Free</div>
            <div className="plan-description">Get started with the essentials, no credit card required.</div>
          </div>

          <div className="plan-pricing">
            <span className="plan-price-currency">₹</span>
            <span className="plan-price-amount">0</span>
            <span className="plan-price-period">/forever</span>
          </div>

          <div className="plan-divider" />

          <ul className="plan-features">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className={`plan-feature-item ${!f.included ? 'feature-dimmed' : ''}`}>
                <div className="plan-feature-icon">
                  <span className="material-icons-outlined">
                    {f.included ? 'check' : 'close'}
                  </span>
                </div>
                {f.text}
              </li>
            ))}
          </ul>

          <button
            className={`plan-cta-btn btn-free ${planButtonState('free') === 'current' ? 'btn-current' : ''}`}
            onClick={() => !user ? navigate('/login') : navigate('/app/dashboard')}
            id="plan-btn-free"
          >
            {!user
              ? 'Get Started Free'
              : subscription?.planId
                ? 'Your Current Plan'
                : 'Already on Free'}
          </button>
        </div>

        {/* ── PRO Plan (Featured) ── */}
        <div className="plan-card plan-featured">
          <div className="plan-popular-badge">⭐ Most Popular</div>

          <div className="plan-header">
            <div className="plan-icon-wrap icon-pro">
              <span className="material-icons-outlined">bolt</span>
            </div>
            <div className="plan-name">Pro</div>
            <div className="plan-description">Full AI-powered analysis for individual healthcare professionals.</div>
          </div>

          <div>
            <div className="plan-pricing">
              <span className="plan-price-currency">₹</span>
              <span className="plan-price-amount">
                {annual ? Math.round((PLANS.pro.price / 100 * 10) / 12) : PLANS.pro.price / 100}
              </span>
              <span className="plan-price-period">/month</span>
            </div>
            {annual && (
              <div className="plan-price-annual">
                {annualTotal('pro')}
              </div>
            )}
          </div>

          <div className="plan-divider" />

          <ul className="plan-features">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="plan-feature-item">
                <div className="plan-feature-icon">
                  <span className="material-icons-outlined">check</span>
                </div>
                {f.text}
              </li>
            ))}
          </ul>

          {(() => {
            const state = planButtonState('pro')
            return (
              <button
                className={`plan-cta-btn btn-pro ${state === 'loading' ? 'btn-loading' : ''} ${state === 'current' ? 'btn-current' : ''}`}
                onClick={() => state === 'idle' && handleUpgrade('pro')}
                disabled={state === 'loading' || state === 'current'}
                id="plan-btn-pro"
              >
                {state === 'loading'
                  ? <div className="btn-spinner" />
                  : state === 'current'
                    ? '✓ Current Plan'
                    : annual
                      ? `Get Pro — ₹${Math.round(PLANS.pro.price / 100 * 10)}/yr`
                      : 'Upgrade to Pro — ₹499/mo'
                }
              </button>
            )
          })()}
        </div>

        {/* ── ELITE Plan ── */}
        <div className="plan-card">
          <div className="plan-header">
            <div className="plan-icon-wrap icon-elite">
              <span className="material-icons-outlined" style={{ color: 'var(--secondary)' }}>
                business
              </span>
            </div>
            <div className="plan-name">Elite</div>
            <div className="plan-description">Enterprise-grade for clinics, hospitals, and large healthcare teams.</div>
          </div>

          <div>
            <div className="plan-pricing">
              <span className="plan-price-currency">₹</span>
              <span className="plan-price-amount">
                {annual ? Math.round((PLANS.elite.price / 100 * 10) / 12) : PLANS.elite.price / 100}
              </span>
              <span className="plan-price-period">/month</span>
            </div>
            {annual && (
              <div className="plan-price-annual" style={{ color: 'var(--secondary)' }}>
                {annualTotal('elite')}
              </div>
            )}
          </div>

          <div className="plan-divider" />

          <ul className="plan-features">
            {ELITE_FEATURES.map((f, i) => (
              <li key={i} className="plan-feature-item">
                <div className="plan-feature-icon" style={{ background: 'rgba(0,88,190,0.1)' }}>
                  <span className="material-icons-outlined" style={{ color: 'var(--secondary-container)' }}>check</span>
                </div>
                {f.text}
              </li>
            ))}
          </ul>

          {(() => {
            const state = planButtonState('elite')
            return (
              <button
                className={`plan-cta-btn btn-elite ${state === 'loading' ? 'btn-loading' : ''} ${state === 'current' ? 'btn-current' : ''}`}
                onClick={() => state === 'idle' && handleUpgrade('elite')}
                disabled={state === 'loading' || state === 'current'}
                id="plan-btn-elite"
              >
                {state === 'loading'
                  ? <div className="btn-spinner" />
                  : state === 'current'
                    ? '✓ Current Plan'
                    : annual
                      ? `Get Elite — ₹${Math.round(PLANS.elite.price / 100 * 10)}/yr`
                      : 'Upgrade to Elite — ₹999/mo'
                }
              </button>
            )
          })()}
        </div>
      </div>

      {/* ── Trust strip ── */}
      <div className="trust-strip">
        <div className="trust-item">
          <span className="material-icons-outlined">lock</span>
          256-bit SSL Encryption
        </div>
        <div className="trust-item">
          <span className="material-icons-outlined">verified_user</span>
          Razorpay Secured
        </div>
        <div className="trust-item">
          <span className="material-icons-outlined">cancel</span>
          Cancel Anytime
        </div>
        <div className="trust-item">
          <span className="material-icons-outlined">replay</span>
          7-Day Free Trial
        </div>
      </div>

      {/* ── FAQ ── */}
      <section className="faq-section">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {FAQS.map((faq, i) => (
            <FaqItem key={i} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      <Footer />

      {/* ── Success modal ── */}
      {successInfo && (
        <SuccessModal
          paymentId={successInfo.paymentId}
          planName={PLANS[successInfo.planId]?.name || successInfo.planId}
          onClose={() => setSuccessInfo(null)}
        />
      )}

      {/* ── Error toast ── */}
      {errorMsg && (
        <div className="payment-toast" role="alert">
          <span className="material-icons-outlined" style={{ fontSize: '18px' }}>error</span>
          {errorMsg}
        </div>
      )}
    </div>
  )
}
