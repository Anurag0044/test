import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signup, login, loginWithGoogle, resetPassword } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function getFirebaseErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.'
      case 'auth/user-not-found':
        return 'No account found with this email.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.'
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.'
      case 'auth/popup-closed-by-user':
        return 'Google sign-in was cancelled.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.'
      default:
        return 'Something went wrong. Please try again.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        if (!name.trim()) {
          setError('Please enter your full name.')
          setIsLoading(false)
          return
        }
        await signup(email, password, name.trim())
      } else {
        await login(email, password)
      }
      navigate('/app/dashboard')
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setSuccessMsg('')
    setIsLoading(true)
    try {
      await loginWithGoogle()
      navigate('/app/dashboard')
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!email) {
      setError('Enter your email above, then click Forgot password.')
      return
    }
    try {
      await resetPassword(email)
      setSuccessMsg('Password reset email sent! Check your inbox.')
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code))
    }
  }

  return (
    <div className="login-page">
      {/* Left Panel - Visual */}
      <div className="login-visual">
        <div className="login-visual-content">
          <div className="login-visual-logo" onClick={() => navigate('/')}>
            <div className="login-logo-icon">M</div>
            <span className="login-logo-text">MedIntel</span>
          </div>
          <div className="login-visual-text">
            <h1 className="headline-lg">Clinical Precision.<br />Tonal Depth.</h1>
            <p className="body-lg login-visual-desc">
              Access the next generation of healthcare intelligence. Secured with
              HIPAA-compliant verification.
            </p>
          </div>
          <div className="login-visual-badge">
            <span className="material-icons-outlined icon-sm">lock</span>
            End-to-End Encryption — Your data is secured by clinical-grade standards.
          </div>
        </div>
        <div className="login-visual-gradient" />
      </div>

      {/* Right Panel - Form */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="headline-sm">{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
            <p className="body-md text-muted">
              {isSignUp
                ? 'Set up your clinical portal access.'
                : 'Sign in to your clinical portal to continue.'}
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="login-alert login-alert-error animate-fade-in">
              <span className="material-icons-outlined icon-sm">error</span>
              {error}
            </div>
          )}
          {successMsg && (
            <div className="login-alert login-alert-success animate-fade-in">
              <span className="material-icons-outlined icon-sm">check_circle</span>
              {successMsg}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            {isSignUp && (
              <div className="form-group">
                <label className="input-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  className="input-field"
                  type="text"
                  placeholder="Dr. Sarah Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="form-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="input-field"
                type="email"
                placeholder="doctor@medintel.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label className="input-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {!isSignUp && (
              <div className="form-row">
                <label className="form-checkbox">
                  <input type="checkbox" />
                  <span className="body-md">Remember me</span>
                </label>
                <a href="#" className="body-md text-primary" onClick={handleForgotPassword}>
                  Forgot password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-lg login-submit-btn ${isLoading ? 'btn-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="btn-spinner" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            <div className="login-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className={`btn btn-outline btn-lg login-social-btn ${isLoading ? 'btn-loading' : ''}`}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="login-switch body-md">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              className="login-switch-btn"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setSuccessMsg('')
              }}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </p>

          <div className="login-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">HIPAA</a>
          </div>
          <p className="login-copyright body-md text-muted">
            © 2024 MedIntel Clinical Systems. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
