import { Outlet } from 'react-router-dom'

import { Header } from '@/components/app/Header'
import { ProgressSidebar } from '@/components/app/ProgressSidebar'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-[17rem_1fr]">
        <ProgressSidebar />
        <main className="min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
