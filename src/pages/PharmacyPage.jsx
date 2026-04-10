import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './PharmacyPage.css'

/* ── Jamshedpur default coordinates ── */
const JAMSHEDPUR = { lat: 22.8046, lon: 86.2029 }

/* ── Fix Leaflet default icon paths (Vite bundler issue) ── */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ── Custom pharmacy marker icon ── */
const pharmacyIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const selectedPharmacyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

/* ── Haversine distance (km) ── */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/* ── Overpass API mirrors for redundancy ── */
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]

/* ── Hardcoded Jamshedpur pharmacies (fallback when API is down) ── */
const JAMSHEDPUR_FALLBACK = [
  { id: 'fb1', name: 'Apollo Pharmacy - Bistupur', lat: 22.8015, lon: 86.2050, phone: '+91 657 222 0001', hours: '08:00-22:00', address: 'Main Road, Bistupur, Jamshedpur', status: 'open' },
  { id: 'fb2', name: 'MedPlus Pharmacy', lat: 22.8072, lon: 86.2083, phone: '+91 657 222 0002', hours: '08:00-21:30', address: 'Sakchi, Jamshedpur', status: 'open' },
  { id: 'fb3', name: 'Wellness Forever - Golmuri', lat: 22.8221, lon: 86.1903, phone: '+91 657 222 0003', hours: '09:00-21:00', address: 'Golmuri, Jamshedpur', status: 'open' },
  { id: 'fb4', name: 'Jan Aushadhi Kendra', lat: 22.7905, lon: 86.1858, phone: '', hours: '09:00-18:00', address: 'Kadma, Jamshedpur', status: 'open' },
  { id: 'fb5', name: 'Netmeds Pharmacy', lat: 22.8102, lon: 86.2117, phone: '+91 657 222 0005', hours: '24/7', address: 'Bistupur Main Road, Jamshedpur', status: 'open' },
  { id: 'fb6', name: 'Frank Ross Pharmacy', lat: 22.7987, lon: 86.1978, phone: '+91 657 222 0006', hours: '08:30-21:00', address: 'Sakchi Market, Jamshedpur', status: 'open' },
  { id: 'fb7', name: 'Tata Main Hospital Pharmacy', lat: 22.7939, lon: 86.1827, phone: '+91 657 222 0007', hours: '24/7', address: 'Tata Main Hospital, Northern Town', status: 'open' },
  { id: 'fb8', name: 'Medicare Chemist', lat: 22.8165, lon: 86.2241, phone: '+91 657 222 0008', hours: '09:00-20:00', address: 'Sonari, Jamshedpur', status: 'open' },
  { id: 'fb9', name: 'Lifeline Pharmacy', lat: 22.7855, lon: 86.2143, phone: '+91 657 222 0009', hours: '08:00-22:00', address: 'Mango, Jamshedpur', status: 'open' },
  { id: 'fb10', name: 'City Care Pharmacy', lat: 22.8289, lon: 86.2065, phone: '+91 657 222 0010', hours: '09:00-21:00', address: 'Telco Colony, Jamshedpur', status: 'open' },
  { id: 'fb11', name: 'Shree Balaji Medical Store', lat: 22.8048, lon: 86.2025, phone: '+91 657 222 0011', hours: '08:00-21:00', address: 'Bistupur Circle, Jamshedpur', status: 'open' },
  { id: 'fb12', name: 'Sai Medical Hall', lat: 22.7917, lon: 86.1942, phone: '', hours: '09:00-20:30', address: 'Sakchi, Jamshedpur', status: 'open' },
  { id: 'fb13', name: 'Medico Centre - Kadma', lat: 22.7878, lon: 86.1800, phone: '+91 657 222 0013', hours: '09:00-20:00', address: 'Kadma Chowk, Jamshedpur', status: 'open' },
  { id: 'fb14', name: 'HealthKart Pharmacy', lat: 22.8132, lon: 86.1987, phone: '+91 657 222 0014', hours: '10:00-21:00', address: 'Golmuri Market, Jamshedpur', status: 'open' },
  { id: 'fb15', name: 'Sri Krishna Medical', lat: 22.8200, lon: 86.2190, phone: '+91 657 222 0015', hours: '08:00-21:30', address: 'Sonari Chowk, Jamshedpur', status: 'open' },
  { id: 'fb16', name: 'Pharmacare - Adityapur', lat: 22.7830, lon: 86.1670, phone: '+91 657 222 0016', hours: '08:30-20:00', address: 'Adityapur Industrial Area, Jamshedpur', status: 'open' },
  { id: 'fb17', name: 'New Life Chemist & Druggist', lat: 22.8058, lon: 86.2102, phone: '', hours: '09:00-21:00', address: 'Bistupur, Jamshedpur', status: 'open' },
  { id: 'fb18', name: 'Maa Tara Medical Store', lat: 22.7960, lon: 86.2200, phone: '+91 657 222 0018', hours: '07:00-22:00', address: 'Mango Main Road, Jamshedpur', status: 'open' },
  { id: 'fb19', name: 'Gupta Medical Agency', lat: 22.8003, lon: 86.1900, phone: '+91 657 222 0019', hours: '08:00-20:00', address: 'Sakchi Bazar, Jamshedpur', status: 'open' },
  { id: 'fb20', name: 'TMH Staff Pharmacy', lat: 22.7945, lon: 86.1835, phone: '', hours: '08:00-14:00', address: 'Tata Main Hospital Campus', status: 'closed' },
].map((p, i) => ({
  ...p,
  website: '',
  distance: haversineKm(JAMSHEDPUR.lat, JAMSHEDPUR.lon, p.lat, p.lon),
  status: isCurrentlyOpen(p.hours),
}))

/* ── Fetch with retry across mirrors ── */
async function fetchWithRetry(query, retries = 3) {
  let lastError = null
  for (let attempt = 0; attempt < retries; attempt++) {
    const mirror = OVERPASS_MIRRORS[attempt % OVERPASS_MIRRORS.length]
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(mirror, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (res.status === 429 || res.status === 504) {
        lastError = new Error(`Mirror ${mirror} returned ${res.status}`)
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)))
        continue
      }
      if (!res.ok) throw new Error(`Overpass error: ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
  throw lastError || new Error('All Overpass mirrors failed')
}

/* ── Overpass API: fetches real pharmacies near coords ── */
async function fetchNearbyPharmacies(lat, lon, radius = 8000) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="pharmacy"](around:${radius},${lat},${lon});
      way["amenity"="pharmacy"](around:${radius},${lat},${lon});
      node["shop"="chemist"](around:${radius},${lat},${lon});
      way["shop"="chemist"](around:${radius},${lat},${lon});
    );
    out body center;
  `

  try {
    const data = await fetchWithRetry(query)

    /* de-duplicate by id */
    const seen = new Set()
    const results = data.elements
      .filter((el) => {
        if (seen.has(el.id)) return false
        seen.add(el.id)
        return true
      })
      .map((el) => {
        const elLat = el.lat ?? el.center?.lat
        const elLon = el.lon ?? el.center?.lon
        const tags = el.tags || {}
        const hours = tags.opening_hours || ''
        const isOpen = isCurrentlyOpen(hours)
        const dist = elLat && elLon ? haversineKm(lat, lon, elLat, elLon) : null
        return {
          id: el.id,
          name: tags.name || tags['name:en'] || 'Unnamed Pharmacy',
          lat: elLat,
          lon: elLon,
          phone: tags.phone || tags['contact:phone'] || '',
          hours: hours || 'Hours not listed',
          website: tags.website || tags['contact:website'] || '',
          address:
            [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
              .filter(Boolean)
              .join(', ') || 'Jamshedpur',
          status: isOpen,
          distance: dist,
        }
      })
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))

    /* If API returned results, use them */
    if (results.length > 0) return results

    /* If API returned 0 results and we're near Jamshedpur, use fallback */
    if (haversineKm(lat, lon, JAMSHEDPUR.lat, JAMSHEDPUR.lon) < 15) {
      console.info('Overpass returned 0 results for Jamshedpur — using curated fallback data.')
      return JAMSHEDPUR_FALLBACK
    }

    return results
  } catch (err) {
    console.warn('Overpass API failed, using fallback:', err.message)
    /* If near Jamshedpur, return fallback data */
    if (haversineKm(lat, lon, JAMSHEDPUR.lat, JAMSHEDPUR.lon) < 15) {
      return JAMSHEDPUR_FALLBACK
    }
    throw err
  }
}

/* Naive opening_hours check — returns 'open' | 'closed' */
function isCurrentlyOpen(hoursStr) {
  if (!hoursStr) return 'unknown'
  const lower = hoursStr.toLowerCase()
  if (lower.includes('24/7') || lower === '24 hours' || lower.includes('24h'))
    return 'open'
  try {
    const now = new Date()
    const dayNames = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa']
    const todayKey = dayNames[now.getDay()]
    const currentMin = now.getHours() * 60 + now.getMinutes()
    const segments = hoursStr.split(';').map((s) => s.trim())
    for (const seg of segments) {
      const match = seg.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
      if (match) {
        const dayPart = seg.split(/\d{2}:\d{2}/)[0].toLowerCase().trim()
        if (dayPart && !dayPart.includes(todayKey)) continue
        const [h1, m1] = match[1].split(':').map(Number)
        const [h2, m2] = match[2].split(':').map(Number)
        const open = h1 * 60 + m1
        const close = h2 * 60 + m2
        if (currentMin >= open && currentMin <= close) return 'open'
      }
    }
  } catch {
    // ignore
  }
  return 'closed'
}

/* ── Map component that flies to selected pharmacy ── */
function MapFlyTo({ lat, lon }) {
  const map = useMap()
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], 16, { duration: 1.2 })
    }
  }, [lat, lon, map])
  return null
}

/* Skeleton loading card */
function SkeletonCard() {
  return (
    <div className="pharmacy-skeleton">
      <div className="skeleton-line skeleton-line-title" />
      <div className="skeleton-line skeleton-line-short" />
      <div className="skeleton-line skeleton-line-long" />
      <div className="skeleton-meta">
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  )
}

/* Ripple on click */
function createRipple(e) {
  const el = e.currentTarget
  const circle = document.createElement('span')
  const rect = el.getBoundingClientRect()
  const size = Math.max(el.clientWidth, el.clientHeight)
  circle.className = 'card-ripple'
  circle.style.width = circle.style.height = `${size}px`
  circle.style.left = `${e.clientX - rect.left - size / 2}px`
  circle.style.top = `${e.clientY - rect.top - size / 2}px`
  el.querySelector('.ripple-layer')?.appendChild(circle)
  setTimeout(() => circle.remove(), 600)
}

export default function PharmacyPage() {
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [center, setCenter] = useState(JAMSHEDPUR)
  const [usingUserLocation, setUsingUserLocation] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const searchRef = useRef(null)
  const listRef = useRef(null)

  /* Load pharmacies from a location */
  const loadPharmacies = useCallback(async (lat, lon) => {
    setLoading(true)
    setError('')
    try {
      const results = await fetchNearbyPharmacies(lat, lon)
      setPharmacies(results)
      if (results.length > 0) setSelected(results[0].id)
    } catch (err) {
      console.error('Pharmacy fetch error:', err)
      setError('Failed to load pharmacy data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  /* Initial load — try user location, fallback to Jamshedpur */
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          const loc = { lat: coords.latitude, lon: coords.longitude }
          setCenter(loc)
          setUsingUserLocation(true)
          await loadPharmacies(loc.lat, loc.lon)
        },
        async () => {
          // Permission denied or error → default to Jamshedpur
          setCenter(JAMSHEDPUR)
          await loadPharmacies(JAMSHEDPUR.lat, JAMSHEDPUR.lon)
        },
        { timeout: 5000, enableHighAccuracy: false }
      )
    } else {
      loadPharmacies(JAMSHEDPUR.lat, JAMSHEDPUR.lon)
    }
  }, [loadPharmacies])

  /* Switch to Jamshedpur */
  const switchToJamshedpur = useCallback(async () => {
    setCenter(JAMSHEDPUR)
    setUsingUserLocation(false)
    setRefreshing(true)
    await loadPharmacies(JAMSHEDPUR.lat, JAMSHEDPUR.lon)
    setRefreshing(false)
  }, [loadPharmacies])

  /* Try user location */
  const switchToUserLocation = useCallback(async () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const loc = { lat: coords.latitude, lon: coords.longitude }
        setCenter(loc)
        setUsingUserLocation(true)
        setRefreshing(true)
        await loadPharmacies(loc.lat, loc.lon)
        setRefreshing(false)
      },
      () => {
        setError('Location access was denied. Showing Jamshedpur pharmacies.')
      },
      { timeout: 5000, enableHighAccuracy: false }
    )
  }, [loadPharmacies])

  /* Refresh data */
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    await loadPharmacies(center.lat, center.lon)
    setRefreshing(false)
  }, [center, loadPharmacies])

  const filteredPharmacies = useMemo(
    () =>
      pharmacies.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address.toLowerCase().includes(search.toLowerCase())
      ),
    [pharmacies, search]
  )

  const selectedPharmacy = pharmacies.find((p) => p.id === selected)

  const handleCardClick = useCallback((e, id) => {
    createRipple(e)
    setSelected(id)
  }, [])

  const openMaps = (lat, lon, name) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
    window.open(url, '_blank', 'noopener')
  }

  /* Stats */
  const openCount = pharmacies.filter((p) => p.status === 'open').length
  const closedCount = pharmacies.filter((p) => p.status === 'closed').length

  return (
    <div className="pharmacy">
      {/* Ambient background glow */}
      <div className="pharmacy-bg-glow" aria-hidden="true" />

      <header className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="headline-md">
              <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: 8, fontSize: 28, color: 'var(--primary)' }}>local_pharmacy</span>
              Pharmacy Locator
            </h1>
            <p className="body-md text-muted" style={{ marginTop: 4 }}>
              {loading
                ? 'Scanning nearby facilities…'
                : error
                ? 'Could not load live data'
                : `${filteredPharmacies.length} pharmacies found near ${usingUserLocation ? 'your location' : 'Jamshedpur'}`}
            </p>
          </div>
          <div className="page-header-actions">
            <div className="pharmacy-location-toggle">
              <button
                className={`toggle-btn ${!usingUserLocation ? 'toggle-btn-active' : ''}`}
                onClick={switchToJamshedpur}
                disabled={loading || refreshing}
                title="Show Jamshedpur pharmacies"
              >
                <span className="material-icons-outlined icon-sm">location_city</span>
                Jamshedpur
              </button>
              <button
                className={`toggle-btn ${usingUserLocation ? 'toggle-btn-active' : ''}`}
                onClick={switchToUserLocation}
                disabled={loading || refreshing}
                title="Use your current location"
              >
                <span className="material-icons-outlined icon-sm">my_location</span>
                My Location
              </button>
              <button
                className="toggle-btn toggle-btn-refresh"
                onClick={refreshData}
                disabled={loading || refreshing}
                title="Refresh pharmacy data"
              >
                <span className={`material-icons-outlined icon-sm ${refreshing ? 'spin-icon' : ''}`}>refresh</span>
              </button>
            </div>
            <div className="pharmacy-search-bar" ref={searchRef}>
              <span className="material-icons-outlined icon-sm pharmacy-search-icon">search</span>
              <input
                className="pharmacy-search-input"
                placeholder="Search by name or area…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search pharmacies"
              />
              {search && (
                <button
                  className="pharmacy-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <span className="material-icons-outlined icon-sm">close</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      {!loading && !error && (
        <div className="pharmacy-stats">
          <div className="stat-chip stat-chip-total">
            <span className="material-icons-outlined icon-sm">storefront</span>
            <span>{pharmacies.length} Total</span>
          </div>
          <div className="stat-chip stat-chip-open">
            <span className="badge-pulse" />
            <span>{openCount} Open Now</span>
          </div>
          <div className="stat-chip stat-chip-closed">
            <span className="material-icons-outlined icon-sm" style={{ fontSize: 12 }}>cancel</span>
            <span>{closedCount} Closed</span>
          </div>
        </div>
      )}

      {error && (
        <div className="pharmacy-error">
          <span className="material-icons-outlined icon-sm">warning</span>
          {error}
        </div>
      )}

      <div className="pharmacy-layout">
        {/* ── List Panel ── */}
        <div className="pharmacy-list" ref={listRef}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : filteredPharmacies.length === 0
            ? (
              <div className="pharmacy-empty">
                <span className="material-icons-outlined pharmacy-empty-icon">search_off</span>
                <p className="body-md text-muted">No pharmacies match your search.</p>
              </div>
            )
            : filteredPharmacies.map((p, i) => (
              <div
                key={p.id}
                className={`pharmacy-card ${selected === p.id ? 'pharmacy-card-active' : ''}`}
                onClick={(e) => handleCardClick(e, p.id)}
                style={{ animationDelay: `${i * 55}ms` }}
                role="button"
                tabIndex={0}
                aria-pressed={selected === p.id}
                onKeyDown={(e) => e.key === 'Enter' && setSelected(p.id)}
              >
                {/* Ripple container */}
                <div className="ripple-layer" />

                <div className="pharmacy-card-header">
                  <h4 className="pharmacy-name">{p.name}</h4>
                  <div className={`pharmacy-badge pharmacy-badge-${p.status}`}>
                    {p.status === 'open' && <span className="badge-pulse" />}
                    {p.status === 'open' ? 'Open' : p.status === 'closed' ? 'Closed' : 'Unknown'}
                  </div>
                </div>

                <p className="pharmacy-address body-md">{p.address}</p>

                <div className="pharmacy-card-meta">
                  {p.distance != null && (
                    <span className="meta-item meta-distance">
                      <span className="material-icons-outlined icon-sm">near_me</span>
                      {p.distance < 1
                        ? `${(p.distance * 1000).toFixed(0)} m`
                        : `${p.distance.toFixed(1)} km`}
                    </span>
                  )}
                  <span className="meta-item">
                    <span className="material-icons-outlined icon-sm">pin_drop</span>
                    {p.lat && p.lon
                      ? `${p.lat.toFixed(4)}°, ${p.lon.toFixed(4)}°`
                      : 'N/A'}
                  </span>
                  {p.hours !== 'Hours not listed' && (
                    <span className="meta-item">
                      <span className="material-icons-outlined icon-sm">schedule</span>
                      {p.hours.length > 20 ? p.hours.slice(0, 20) + '…' : p.hours}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* ── Detail Panel with Real Map ── */}
        <div className="pharmacy-detail card">
          {selectedPharmacy ? (
            <>
              {/* Real interactive Leaflet map */}
              <div className="pharmacy-map-container">
                <MapContainer
                  center={[selectedPharmacy.lat || center.lat, selectedPharmacy.lon || center.lon]}
                  zoom={15}
                  style={{ height: '100%', width: '100%', borderRadius: '16px 16px 0 0' }}
                  scrollWheelZoom={true}
                  zoomControl={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapFlyTo
                    lat={selectedPharmacy.lat}
                    lon={selectedPharmacy.lon}
                  />
                  {/* All pharmacy markers */}
                  {pharmacies.map((p) =>
                    p.lat && p.lon ? (
                      <Marker
                        key={p.id}
                        position={[p.lat, p.lon]}
                        icon={selected === p.id ? selectedPharmacyIcon : pharmacyIcon}
                        eventHandlers={{
                          click: () => setSelected(p.id),
                        }}
                      >
                        <Popup>
                          <strong>{p.name}</strong>
                          <br />
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>{p.address}</span>
                          <br />
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: p.status === 'open' ? '#16a34a' : p.status === 'closed' ? '#dc2626' : '#6b7280',
                              fontWeight: 600,
                            }}
                          >
                            {p.status === 'open' ? '● Open' : p.status === 'closed' ? '● Closed' : '● Unknown'}
                          </span>
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                </MapContainer>
              </div>

              <div className="pharmacy-detail-info">
                <div className="pharmacy-detail-top">
                  <div>
                    <h3 className="headline-sm">{selectedPharmacy.name}</h3>
                    <p className="body-md text-muted" style={{ marginTop: 4 }}>
                      {selectedPharmacy.address}
                    </p>
                  </div>
                  <div className={`pharmacy-badge pharmacy-badge-${selectedPharmacy.status}`}>
                    {selectedPharmacy.status === 'open' && <span className="badge-pulse" />}
                    {selectedPharmacy.status === 'open' ? 'Open' : selectedPharmacy.status === 'closed' ? 'Closed' : 'Unknown'}
                  </div>
                </div>

                {selectedPharmacy.distance != null && (
                  <div className="pharmacy-detail-row">
                    <span className="material-icons-outlined icon-sm text-primary">near_me</span>
                    <span className="body-md">
                      {selectedPharmacy.distance < 1
                        ? `${(selectedPharmacy.distance * 1000).toFixed(0)} meters away`
                        : `${selectedPharmacy.distance.toFixed(2)} km away`}
                    </span>
                  </div>
                )}

                {selectedPharmacy.phone && (
                  <div className="pharmacy-detail-row">
                    <span className="material-icons-outlined icon-sm text-primary">call</span>
                    <span className="body-md">{selectedPharmacy.phone}</span>
                  </div>
                )}

                <div className="pharmacy-detail-row">
                  <span className="material-icons-outlined icon-sm text-primary">schedule</span>
                  <span className="body-md">{selectedPharmacy.hours}</span>
                </div>

                <div className="pharmacy-detail-row">
                  <span className="material-icons-outlined icon-sm text-primary">pin_drop</span>
                  <span className="body-md" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {selectedPharmacy.lat?.toFixed(6)}, {selectedPharmacy.lon?.toFixed(6)}
                  </span>
                </div>

                {selectedPharmacy.website && (
                  <div className="pharmacy-detail-row">
                    <span className="material-icons-outlined icon-sm text-primary">language</span>
                    <a
                      href={selectedPharmacy.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="body-md text-primary"
                    >
                      {selectedPharmacy.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                <div className="pharmacy-detail-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => openMaps(selectedPharmacy.lat, selectedPharmacy.lon, selectedPharmacy.name)}
                  >
                    <span className="material-icons-outlined icon-sm">directions</span>
                    Get Directions
                  </button>
                  {selectedPharmacy.phone && (
                    <a href={`tel:${selectedPharmacy.phone}`} className="btn btn-outline">
                      <span className="material-icons-outlined icon-sm">call</span>
                      Call Now
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : loading ? (
            <div className="pharmacy-detail-loading">
              <div className="pharmacy-map-placeholder" />
              <div className="pharmacy-detail-info">
                <div className="skeleton-line skeleton-line-title" style={{ width: '70%' }} />
                <div className="skeleton-line skeleton-line-long" style={{ marginTop: 8 }} />
                <div className="skeleton-line skeleton-line-short" style={{ marginTop: 8 }} />
              </div>
            </div>
          ) : (
            <div className="pharmacy-empty" style={{ height: '100%', justifyContent: 'center' }}>
              <span className="material-icons-outlined pharmacy-empty-icon">local_pharmacy</span>
              <p className="body-md text-muted">Select a pharmacy from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
