import { cn } from '@/lib/cn'
import { dayNumberToDate, getDayNumber, type getStreaks } from '@/state/activity'

const WEEKS = 52
const levelClasses = [
  'bg-muted',
  'bg-primary/25',
  'bg-primary/50',
  'bg-primary/75',
  'bg-primary',
]
const monthFormatter = new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' })
const dayFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function getLevel(solved: number) {
  if (solved <= 2) {
    return solved
  }

  return solved <= 4 ? 3 : 4
}

const formatDays = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`

export function ActivityHeatmap({
  solvedByDay,
  streaks,
}: {
  solvedByDay: Map<number, number>
  streaks: ReturnType<typeof getStreaks>
}) {
  const now = new Date()
  const today = getDayNumber(now)
  const thisWeekStart = today - now.getDay()
  // Newest week first: the scroller below lays its columns out in reverse.
  const weekStarts = Array.from({ length: WEEKS }, (_, index) => thisWeekStart - index * 7)
  const firstDay = thisWeekStart - (WEEKS - 1) * 7
  let solvedInRange = 0

  for (const [day, solved] of solvedByDay) {
    if (day >= firstDay) {
      solvedInRange += solved
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
      <dl className="flex gap-6 lg:w-36 lg:flex-col lg:gap-3">
        <Stat label="Current streak" value={formatDays(streaks.current)} />
        <Stat label="Best streak" value={formatDays(streaks.best)} />
        <Stat label="Active days" value={solvedByDay.size} />
      </dl>
      <div className="ml-auto min-w-0 max-w-full">
        <div className="flex gap-1">
          <div
            aria-hidden
            className="grid w-6 shrink-0 gap-1 pt-4 text-[10px] leading-3 text-muted-foreground"
          >
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, index) => (
              <span className="h-3" key={index}>
                {label}
              </span>
            ))}
          </div>
          {/* The reversed row makes the scroll position start at the newest
              week when a narrow screen cannot fit the whole year. */}
          <div
            // Per-day counts are hover-only, so the label carries the total.
            aria-label={`Problems solved per day over the last year, ${solvedInRange} in total`}
            className="flex min-w-0 flex-row-reverse gap-1 overflow-x-auto px-0.5 pb-1"
            role="img"
          >
            {weekStarts.map((weekStart) => {
              const month = dayNumberToDate(weekStart).getUTCMonth()
              const startsMonth = dayNumberToDate(weekStart - 7).getUTCMonth() !== month

              return (
                <div className="grid shrink-0 gap-1" key={weekStart}>
                  <span className="h-3 w-3 whitespace-nowrap text-[10px] leading-3 text-muted-foreground">
                    {startsMonth ? monthFormatter.format(dayNumberToDate(weekStart)) : null}
                  </span>
                  {Array.from({ length: 7 }, (_, offset) => {
                    const day = weekStart + offset

                    if (day > today) {
                      return <span className="size-3" key={day} />
                    }

                    const solved = solvedByDay.get(day) ?? 0

                    return (
                      <span
                        className={cn(
                          'size-3 rounded-[3px]',
                          levelClasses[getLevel(solved)],
                          day === today &&
                            'ring-1 ring-ring ring-offset-1 ring-offset-background',
                        )}
                        key={day}
                        title={`${dayFormatter.format(dayNumberToDate(day))}: ${solved} solved`}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <div
          aria-hidden
          className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground"
        >
          Less
          {levelClasses.map((levelClass) => (
            <span className={cn('size-3 rounded-[3px]', levelClass)} key={levelClass} />
          ))}
          More
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col-reverse">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums tracking-tight">{value}</dd>
    </div>
  )
}
