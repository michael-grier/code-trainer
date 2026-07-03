import { useParams } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ConceptPage() {
  const { slug } = useParams()

  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Lesson: {slug ?? 'unknown'}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          MDX lesson content and problem links will render here once the
          curriculum registry is added.
        </CardContent>
      </Card>
    </div>
  )
}

