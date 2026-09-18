import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { isLessonAvailable, lessons } from '@/curriculum'
import { problemKindLabels } from '@/curriculum/problemKinds'
import { cn } from '@/lib/cn'

type JumpTarget = {
  id: string
  path: string
  title: string
  detail: string
}

const MAX_RESULTS = 12

const targets: JumpTarget[] = lessons.filter(isLessonAvailable).flatMap((lesson) => [
  {
    id: `lesson:${lesson.slug}`,
    path: `/lesson/${lesson.slug}`,
    title: lesson.title,
    detail: 'Lesson',
  },
  ...lesson.problems.map((problem) => ({
    id: `problem:${lesson.slug}/${problem.id}`,
    path: `/lesson/${lesson.slug}/problem/${problem.id}`,
    title: problem.title,
    detail: `${lesson.title} · ${problemKindLabels[problem.kind]}`,
  })),
])

// Rank title-prefix matches above other matches, and lessons above problems,
// so typing a lesson name lands on the lesson rather than its first problem.
function searchTargets(query: string) {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return targets.filter((target) => target.detail === 'Lesson').slice(0, MAX_RESULTS)
  }

  return targets
    .map((target) => {
      const title = target.title.toLowerCase()
      const haystack = `${title} ${target.detail.toLowerCase()}`
      const score = title.startsWith(normalized)
        ? 0
        : title.includes(normalized)
          ? 1
          : haystack.includes(normalized)
            ? 2
            : undefined

      return score === undefined ? undefined : { target, score }
    })
    .filter((match) => match !== undefined)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_RESULTS)
    .map((match) => match.target)
}

export function JumpPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()
  const results = useMemo(() => searchTargets(query), [query])
  const activeTarget = results[Math.min(activeIndex, results.length - 1)]

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)

    if (next) {
      setQuery('')
      setActiveIndex(0)
    }
  }

  const go = (target: JumpTarget | undefined) => {
    if (target) {
      navigate(target.path)
    }
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(activeTarget)
    }
  }

  return (
    <DialogPrimitive.Root onOpenChange={handleOpenChange} open={open}>
      <DialogPrimitive.Trigger asChild>
        <Button className="gap-2 text-muted-foreground" size="sm" variant="outline">
          <Search className="size-4" />
          <span className="hidden sm:inline">Jump to</span>
          <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
            Ctrl K
          </kbd>
          <span className="sr-only">Jump to a lesson or problem</span>
        </Button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[min(38rem,92vw)] -translate-x-1/2 overflow-hidden rounded-lg border bg-background shadow-lg outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Jump to a lesson or problem
          </DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-activedescendant={activeTarget ? `jump-${activeTarget.id}` : undefined}
              aria-autocomplete="list"
              aria-controls="jump-results"
              aria-expanded="true"
              autoFocus
              className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search lessons and problems"
              role="combobox"
              value={query}
            />
          </div>
          <ul
            className="max-h-[50vh] overflow-y-auto p-2 text-sm"
            id="jump-results"
            role="listbox"
          >
            {results.length === 0 ? (
              <li className="px-3 py-6 text-center text-muted-foreground">
                Nothing matches that.
              </li>
            ) : null}
            {results.map((target) => {
              const isActive = target.id === activeTarget?.id

              return (
                <li
                  aria-selected={isActive}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2',
                    isActive && 'bg-accent text-accent-foreground',
                  )}
                  id={`jump-${target.id}`}
                  key={target.id}
                  onClick={() => go(target)}
                  onMouseMove={() => setActiveIndex(results.indexOf(target))}
                  role="option"
                >
                  <span className="min-w-0 truncate">{target.title}</span>
                  <span className="shrink-0 truncate text-xs text-muted-foreground">
                    {target.detail}
                  </span>
                </li>
              )
            })}
          </ul>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
