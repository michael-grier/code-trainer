import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProgressPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6">
      <div>
        <p className="text-sm font-medium text-primary">Progress</p>
        <h1 className="text-3xl font-semibold tracking-normal">
          Curriculum map
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Coming next</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This page will show track completion, lesson status, focus lesson
          controls, filters, and guided-path recovery.
        </CardContent>
      </Card>
    </div>
  )
}

