import { useParams } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProblemPage() {
  const { problemId, slug } = useParams()

  return (
    <div className="mx-auto max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>
            Problem: {slug ?? 'unknown'} / {problemId ?? 'unknown'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The shared problem workspace and renderer registry will be wired after
          the curriculum and progress contracts are in place.
        </CardContent>
      </Card>
    </div>
  )
}

