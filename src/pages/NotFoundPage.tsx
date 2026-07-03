import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="grid max-w-md gap-4 text-center">
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Page not found
        </h1>
        <p className="text-muted-foreground">
          The route does not exist in the Code Trainer workspace.
        </p>
        <Button asChild className="justify-self-center">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  )
}

