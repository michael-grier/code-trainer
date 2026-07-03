import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <Card className="max-w-md">
        <CardContent className="grid gap-4 p-6 text-center">
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
        </CardContent>
      </Card>
    </main>
  )
}
