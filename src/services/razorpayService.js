/**
 * razorpayService.js
 * Handles Razorpay payment initialization and subscription management via Firestore.
 */
import { db } from './firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'

// ── Plan configuration ────────────────────────────────────────────────────────
export const PLANS = {
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 49900,          // in paise (₹499/month)
    displayPrice: '₹499',
    period: 'month',
    description: 'Full access to AI-powered medicine analysis',
    features: [
      'Unlimited medicine analysis',
      'Advanced AI pharmacokinetics',
      'Predictive drug interactions',
      'Priority support (24/7)',
      'Bulk prescription upload',
      'Export PDF reports',
      'Custom drug watchlists',
    ],
    razorpayPlanId: null, // Set if using subscriptions
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 99900,          // in paise (₹999/month)
    displayPrice: '₹999',
    period: 'month',
    description: 'Designed for clinics, hospitals & healthcare enterprises',
    features: [
      'Everything in Pro',
      'Multi-user team access (up to 25)',
      'EHR / EMR integration support',
      'White-label reports',
      'Advanced analytics dashboard',
      'HIPAA-ready data export',
      'Dedicated account manager',
      'Custom API access',
    ],
    razorpayPlanId: null,
  },
}

// ── Load Razorpay script dynamically ─────────────────────────────────────────
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ── Open Razorpay checkout ────────────────────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.planId   - 'pro' | 'elite'
 * @param {object} params.user     - Firebase user object
 * @param {string} params.razorpayKey - VITE_RAZORPAY_KEY_ID from env
 * @param {function} params.onSuccess - Callback on payment success
 * @param {function} params.onError   - Callback on failure
 */
export async function initiatePayment({ planId, user, razorpayKey, onSuccess, onError }) {
  const plan = PLANS[planId]
  if (!plan) {
    onError(new Error('Invalid plan selected'))
    return
  }

  const loaded = await loadRazorpayScript()
  if (!loaded) {
    onError(new Error('Failed to load Razorpay. Check your connection.'))
    return
  }

  const options = {
    key: razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: plan.price,
    currency: 'INR',
    name: 'MedIntel',
    description: `${plan.name} Plan — ${plan.displayPrice}/${plan.period}`,
    image: '', // optional logo URL
    prefill: {
      name: user?.displayName || '',
      email: user?.email || '',
    },
    notes: {
      planId,
      userId: user?.uid || '',
    },
    theme: {
      color: '#006c49',
      backdrop_color: 'rgba(15,20,25,0.85)',
    },
    modal: {
      ondismiss: () => {
        // User closed the modal without paying
        onError(new Error('Payment cancelled'))
      },
    },
    handler: async function (response) {
      // Called on successful payment
      try {
        await saveSubscription(user.uid, planId, {
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id || null,
          razorpaySignature: response.razorpay_signature || null,
        })
        onSuccess({ planId, paymentId: response.razorpay_payment_id })
      } catch (err) {
        onError(err)
      }
    },
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', (response) => {
    onError(new Error(response.error?.description || 'Payment failed'))
  })
  rzp.open()
}

// ── Save subscription to Firestore ───────────────────────────────────────────
export async function saveSubscription(uid, planId, paymentDetails = {}) {
  await setDoc(
    doc(db, 'subscriptions', uid),
    {
      planId,
      status: 'active',
      activatedAt: serverTimestamp(),
      expiresAt: null, // set server-side in production
      ...paymentDetails,
    },
    { merge: true }
  )
}

// ── Fetch user's active subscription ─────────────────────────────────────────
export async function getUserSubscription(uid) {
  if (!uid) return null
  const snap = await getDoc(doc(db, 'subscriptions', uid))
  if (snap.exists()) return snap.data()
  return null
}
