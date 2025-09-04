import { Outlet } from '@tanstack/react-router'
import { Navigation } from '../components/Navigation'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-6">
        <Outlet />
      </main>
    </div>
  )
}
