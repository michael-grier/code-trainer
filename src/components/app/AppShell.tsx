import { BookOpen, GraduationCap, PanelLeft, Route } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

import { ThemeToggle } from '@/components/app/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/', label: 'Dashboard', icon: GraduationCap },
  { to: '/progress', label: 'Progress', icon: Route },
]

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-4">
          <Button className="md:hidden" size="icon" variant="ghost">
            <PanelLeft className="size-4" />
            <span className="sr-only">Open navigation</span>
          </Button>
          <div className="flex items-center gap-2 font-semibold">
            <BookOpen className="size-5 text-primary" />
            <span>Code Trainer</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
              Local progress
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-[17rem_1fr]">
        <aside className="hidden border-r bg-muted/20 p-3 md:block">
          <Card className="border-dashed shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Learning workspace</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              {navItems.map((item) => (
                <NavLink
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground outline-none transition hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                      isActive && 'bg-accent text-accent-foreground',
                    )
                  }
                  end={item.to === '/'}
                  key={item.to}
                  to={item.to}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </CardContent>
          </Card>
        </aside>
        <main className="min-w-0 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

