import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../services/firebase'
import Footer from '../components/Footer'
import './ProfilePage.css'

const prescriptions = [
  { name: 'Donepezil 10mg', patient: 'Mr. Arthur Miller', date: 'Oct 22, 2023', status: 'Active' },
  { name: 'Memantine 20mg XR', patient: 'Mrs. Elena Rodriguez', date: 'Oct 20, 2023', status: 'Active' },
  { name: 'Sertraline 50mg', patient: 'James K. Peterson', date: 'Oct 18, 2023', status: 'Completed' },
]

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth()
  const fileInputRef = useRef(null)

  // Edit mode
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [department, setDepartment] = useState('')
  const [licenseId, setLicenseId] = useState('')
  const [phone, setPhone] = useState('')

  // Photo state
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)

  // Status
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Load user data on mount + when user changes
  useEffect(() => {
    if (!user) return

    setDisplayName(user.displayName || '')
    setPhotoPreview(user.photoURL || null)

    // Load extra profile data from Firestore
    async function loadProfile() {
      try {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDepartment(data.department || '')
          setLicenseId(data.licenseId || '')
          setPhone(data.phone || '')
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setProfileLoaded(true)
      }
    }
    loadProfile()
  }, [user])

  // Generate avatar initials
  function getInitials() {
    if (displayName) {
      return displayName
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) return user.email[0].toUpperCase()
    return '?'
  }

  // Handle photo file selection
  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image must be under 5MB.', type: 'error' })
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please select an image file.', type: 'error' })
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setMessage({ text: '', type: '' })
  }

  // Upload photo to Firebase Storage and return download URL
  async function uploadPhoto() {
    if (!photoFile || !user) return null

    setIsUploadingPhoto(true)
    try {
      const storageRef = ref(storage, `profile-photos/${user.uid}`)
      await uploadBytes(storageRef, photoFile)
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (err) {
      console.error('Photo upload failed:', err)
      throw err
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  // Remove photo
  function handleRemovePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Enter edit mode
  function handleEditClick() {
    setIsEditing(true)
    setMessage({ text: '', type: '' })
  }

  // Cancel editing
  function handleCancel() {
    setIsEditing(false)
    setMessage({ text: '', type: '' })
    // Reset to current values
    setDisplayName(user?.displayName || '')
    setPhotoPreview(user?.photoURL || null)
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Save profile changes
  async function handleSave() {
    setIsSaving(true)
    setMessage({ text: '', type: '' })

    try {
      let newPhotoURL = user?.photoURL || null

      // Upload new photo if selected
      if (photoFile) {
        newPhotoURL = await uploadPhoto()
      } else if (!photoPreview && user?.photoURL) {
        // User removed their photo
        newPhotoURL = ''
      }

      // Update Firebase Auth profile (displayName + photoURL)
      const authUpdates = {}
      if (displayName !== user?.displayName) {
        authUpdates.displayName = displayName
      }
      if (newPhotoURL !== user?.photoURL) {
        authUpdates.photoURL = newPhotoURL || ''
      }
      if (Object.keys(authUpdates).length > 0) {
        await updateUserProfile(authUpdates)
      }

      // Save extra fields to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        department,
        licenseId,
        phone,
        email: user.email,
        displayName: displayName,
        photoURL: newPhotoURL || '',
        updatedAt: new Date().toISOString(),
      }, { merge: true })

      setPhotoFile(null)
      setIsEditing(false)
      setMessage({ text: 'Profile updated successfully!', type: 'success' })

      // Clear success message after 4 seconds
      setTimeout(() => setMessage({ text: '', type: '' }), 4000)
    } catch (err) {
      console.error('Save profile error:', err)
      setMessage({ text: 'Failed to save profile. Please try again.', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  // Format last login
  function formatLastLogin() {
    if (!user?.metadata?.lastSignInTime) return 'N/A'
    const date = new Date(user.metadata.lastSignInTime)
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    }) + ' — ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit'
    })
  }

  // Format creation date
  function formatCreatedAt() {
    if (!user?.metadata?.creationTime) return 'N/A'
    const date = new Date(user.metadata.creationTime)
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  return (
    <div className="profile">
      <header className="page-header">
        <div>
          <h1 className="headline-md">Profile</h1>
        </div>
      </header>

      {/* Status Messages */}
      {message.text && (
        <div className={`profile-message profile-message-${message.type} animate-fade-in`}>
          <span className="material-icons-outlined icon-sm">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {message.text}
        </div>
      )}

      {/* Profile Header Card */}
      <div className="card profile-hero">
        <div className="profile-hero-bg" />
        <div className="profile-hero-content">
          <div
            className={`profile-avatar-lg ${isEditing ? 'profile-avatar-editable' : ''}`}
            onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
          >
            {(isUploadingPhoto) ? (
              <div className="profile-avatar-spinner" />
            ) : photoPreview ? (
              <img src={photoPreview} alt="Profile" className="profile-avatar-image" />
            ) : (
              <span className="profile-avatar-text">{getInitials()}</span>
            )}
            {isEditing && (
              <div className="profile-avatar-overlay">
                <span className="material-icons-outlined">photo_camera</span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="profile-file-input"
              onChange={handlePhotoSelect}
            />
          </div>

          <div className="profile-hero-info">
            <h2 className="headline-sm">{displayName || user?.email || 'User'}</h2>
            <p className="body-md text-muted">{department || user?.email}</p>
          </div>

          {!isEditing ? (
            <button className="btn btn-outline btn-sm profile-edit-btn" onClick={handleEditClick}>
              <span className="material-icons-outlined icon-sm">edit</span>
              Edit Profile
            </button>
          ) : (
            <div className="profile-hero-actions">
              {photoPreview && (
                <button
                  className="btn btn-ghost btn-sm profile-remove-photo-btn"
                  onClick={handleRemovePhoto}
                  type="button"
                >
                  <span className="material-icons-outlined icon-sm">delete</span>
                  Remove Photo
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="profile-grid">
        {/* Details — View or Edit */}
        <div className="card profile-details-card">
          <div className="profile-details-header">
            <h3 className="title-lg profile-section-title">Profile Details</h3>
            {isEditing && (
              <span className="chip chip-info">Editing</span>
            )}
          </div>

          {!isEditing ? (
            /* ── View Mode ── */
            <div className="profile-details-list">
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">person</span>
                <div>
                  <span className="label-md text-muted">Full Name</span>
                  <span className="body-lg">{displayName || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">email</span>
                <div>
                  <span className="label-md text-muted">Email</span>
                  <span className="body-lg">{user?.email || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">local_hospital</span>
                <div>
                  <span className="label-md text-muted">Department</span>
                  <span className="body-lg">{department || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">badge</span>
                <div>
                  <span className="label-md text-muted">License ID</span>
                  <span className="body-lg">{licenseId || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">phone</span>
                <div>
                  <span className="label-md text-muted">Phone</span>
                  <span className="body-lg">{phone || '—'}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">circle</span>
                <div>
                  <span className="label-md text-muted">Status</span>
                  <span className="chip chip-success">Active</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">login</span>
                <div>
                  <span className="label-md text-muted">Last Login</span>
                  <span className="body-lg">{formatLastLogin()}</span>
                </div>
              </div>
              <div className="profile-detail-row">
                <span className="material-icons-outlined icon-sm text-muted">calendar_today</span>
                <div>
                  <span className="label-md text-muted">Member Since</span>
                  <span className="body-lg">{formatCreatedAt()}</span>
                </div>
              </div>
            </div>
          ) : (
            /* ── Edit Mode ── */
            <div className="profile-edit-form">
              <div className="profile-edit-group">
                <label className="input-label" htmlFor="edit-name">
                  <span className="material-icons-outlined icon-sm">person</span>
                  Full Name
                </label>
                <input
                  id="edit-name"
                  className="input-field"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  disabled={isSaving}
                />
              </div>

              <div className="profile-edit-group">
                <label className="input-label" htmlFor="edit-email">
                  <span className="material-icons-outlined icon-sm">email</span>
                  Email
                </label>
                <input
                  id="edit-email"
                  className="input-field input-field-disabled"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
                <span className="profile-edit-hint">Email cannot be changed here</span>
              </div>

              <div className="profile-edit-group">
                <label className="input-label" htmlFor="edit-department">
                  <span className="material-icons-outlined icon-sm">local_hospital</span>
                  Department
                </label>
                <input
                  id="edit-department"
                  className="input-field"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Neurology & Cognitive Sciences"
                  disabled={isSaving}
                />
              </div>

              <div className="profile-edit-group">
                <label className="input-label" htmlFor="edit-license">
                  <span className="material-icons-outlined icon-sm">badge</span>
                  License ID
                </label>
                <input
                  id="edit-license"
                  className="input-field"
                  type="text"
                  value={licenseId}
                  onChange={(e) => setLicenseId(e.target.value)}
                  placeholder="e.g. #NY-88294-B"
                  disabled={isSaving}
                />
              </div>

              <div className="profile-edit-group">
                <label className="input-label" htmlFor="edit-phone">
                  <span className="material-icons-outlined icon-sm">phone</span>
                  Phone Number
                </label>
                <input
                  id="edit-phone"
                  className="input-field"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 123-4567"
                  disabled={isSaving}
                />
              </div>

              <div className="profile-edit-actions">
                <button
                  className="btn btn-ghost"
                  onClick={handleCancel}
                  disabled={isSaving}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`btn btn-primary ${isSaving ? 'btn-loading' : ''}`}
                  onClick={handleSave}
                  disabled={isSaving}
                  type="button"
                >
                  {isSaving ? (
                    <>
                      <span className="btn-spinner" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined icon-sm">save</span>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Saved Prescriptions */}
        <div className="card profile-prescriptions-card">
          <h3 className="title-lg profile-section-title">Saved Prescriptions</h3>
          <p className="body-md text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Recent clinical orders and digital prescriptions
          </p>
          <div className="prescriptions-list">
            {prescriptions.map((rx, i) => (
              <div key={i} className="prescription-item" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="prescription-icon">
                  <span className="material-icons-outlined">description</span>
                </div>
                <div className="prescription-info">
                  <h4 className="body-lg" style={{ fontWeight: 600 }}>{rx.name}</h4>
                  <p className="body-md text-muted">Patient: {rx.patient}</p>
                  <p className="body-md text-muted">{rx.date}</p>
                </div>
                <span className={`chip ${rx.status === 'Active' ? 'chip-success' : 'chip-neutral'}`}>
                  {rx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
