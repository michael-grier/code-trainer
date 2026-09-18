import { Outlet, ScrollRestoration } from 'react-router-dom'

import { Header } from '@/components/app/Header'
import { Sidebar } from '@/components/app/Sidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[16rem_1fr]">
        <Sidebar />
        <main className="min-w-0 px-5 py-8 md:px-10">
          <Outlet />
        </main>
      </div>
      {/* Client-side navigations otherwise keep the previous page's scroll
          offset, so a lesson opened from low on the dashboard starts mid-text. */}
      <ScrollRestoration />
    </div>
  )
}
