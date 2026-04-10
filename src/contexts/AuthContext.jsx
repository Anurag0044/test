import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, googleProvider } from '../services/firebase'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  // Sign up with email & password, then set displayName
  async function signup(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(result.user, { displayName })
    }
    return result
  }

  // Sign in with email & password
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Sign in with Google popup
  function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  // Sign out
  function logout() {
    return signOut(auth)
  }

  // Password reset email
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email)
  }

  // Update user's Firebase Auth profile (displayName, photoURL)
  // and force a re-render so sidebar/profile pick up the changes
  async function updateUserProfile(updates) {
    if (!auth.currentUser) return
    await updateProfile(auth.currentUser, updates)
    // Force a state refresh since onAuthStateChanged doesn't fire for profile updates
    setUser({ ...auth.currentUser })
  }

  const value = {
    user,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
