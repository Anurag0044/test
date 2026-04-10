import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import './AppLayout.css'

export default function AppLayout() {
  const location = useLocation()
  const [transitionState, setTransitionState] = useState('entered')

  /* Trigger transition on route change */
  useEffect(() => {
    setTransitionState('entering')
    const timer = setTimeout(() => setTransitionState('entered'), 50)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`app-main app-main-${transitionState}`}>
        <Outlet />
      </main>
    </div>
  )
}
