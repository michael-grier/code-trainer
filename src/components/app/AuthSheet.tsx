import {
  CircleCheck,
  Github,
  LoaderCircle,
  LogIn,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AuthActionError, useAppAuth } from '@/state/authContext'
import {
  getAuthErrorMessage,
  getSignOutReadiness,
  GITHUB_AUTH_ERROR_QUERY_PARAM,
  GITHUB_AUTH_RETURN_TO_QUERY_PARAM,
  GITHUB_SIGN_IN_ERROR_MESSAGE,
} from '@/state/authFlow'
import { summarizeProgress, type ProgressSummary } from '@/state/cloudProgress'
import {
  useProgress,
  type ProgressHandoff,
  type SyncStatus,
} from '@/state/progressContext'

type SheetStep =
  | 'signin'
  | 'progress'
  | 'account'
  | 'signout-warning'

export function AuthSheet() {
  const auth = useAppAuth()
  const progress = useProgress()
  const location = useLocation()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<SheetStep>('signin')
  const [error, setError] = useState<string>()
  const [isWorking, setIsWorking] = useState(false)
  const [signOutEverywhere, setSignOutEverywhere] = useState(false)
  const deviceSummary = useMemo(
    () => summarizeProgress(progress.state),
    [progress.state],
  )
  const hasKnownUser = Boolean(auth.user)
  const isChecking =
    (auth.status === 'loading' || auth.status === 'refreshing') &&
    !hasKnownUser
  const isDisabled = auth.status === 'unconfigured' || isChecking
  const hasHandoff = Boolean(progress.handoff)

  const closeSheet = useCallback(() => {
    setOpen(false)
    setError(undefined)
    setIsWorking(false)
    setSignOutEverywhere(false)
  }, [])

  useEffect(() => {
    if (!hasHandoff) {
      return
    }

    setOpen(true)
    setStep('progress')
    setError(undefined)
  }, [hasHandoff])

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)

    if (searchParams.get(GITHUB_AUTH_ERROR_QUERY_PARAM) !== '1') {
      return
    }

    const returnTo = searchParams.get(GITHUB_AUTH_RETURN_TO_QUERY_PARAM)
    searchParams.delete(GITHUB_AUTH_ERROR_QUERY_PARAM)
    searchParams.delete(GITHUB_AUTH_RETURN_TO_QUERY_PARAM)
    searchParams.delete('error')
    searchParams.delete('error_description')

    let recoveryLocation = {
      pathname: location.pathname,
      search: searchParams.size > 0 ? `?${searchParams.toString()}` : '',
      hash: location.hash,
    }

    if (returnTo) {
      try {
        const returnUrl = new URL(returnTo, window.location.origin)

        // Treat the callback query as untrusted and never navigate off-origin.
        if (returnUrl.origin === window.location.origin) {
          recoveryLocation = {
            pathname: returnUrl.pathname,
            search: returnUrl.search,
            hash: returnUrl.hash,
          }
        }
      } catch {
        // A malformed return path falls back to the cleaned current route.
      }
    }

    navigate(recoveryLocation, { replace: true })
    setStep('signin')
    setError(GITHUB_SIGN_IN_ERROR_MESSAGE)
    setOpen(true)
  }, [location.hash, location.pathname, location.search, navigate])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStep(
        progress.handoff ? 'progress' : hasKnownUser ? 'account' : 'signin',
      )
      setError(undefined)
      setOpen(true)
      return
    }

    closeSheet()
  }

  const signInWithGitHub = async () => {
    setError(undefined)
    setIsWorking(true)

    try {
      await auth.signInWithGitHub()
    } catch (signInError) {
      setError(getAuthErrorMessage(toAuthActionError(signInError), 'signin'))
    } finally {
      setIsWorking(false)
    }
  }

  const moveAndContinue = async () => {
    setError(undefined)
    const saved = await progress.handoff?.moveAndContinue()

    if (saved) {
      closeSheet()
    } else {
      setError('Cloud save did not finish. Both local copies are still safe.')
    }
  }

  const useAccountProgress = () => {
    progress.handoff?.useAccountProgress()
    closeSheet()
  }

  const beginSignOut = async (everywhere: boolean) => {
    setError(undefined)
    setIsWorking(true)
    setSignOutEverywhere(everywhere)

    const readiness = await getSignOutReadiness(progress.flushProgress)

    if (readiness === 'unsynced') {
      setStep('signout-warning')
      setIsWorking(false)
      return
    }

    await finishSignOut(everywhere)
  }

  const finishSignOut = async (everywhere: boolean) => {
    setError(undefined)
    setIsWorking(true)

    try {
      if (everywhere) {
        await auth.signOutAllDevices()
      } else {
        await auth.signOut()
      }

      closeSheet()
    } catch (signOutError) {
      setError(getAuthErrorMessage(toAuthActionError(signOutError), 'signout'))
      setIsWorking(false)
    }
  }

  return (
    <Sheet onOpenChange={handleOpenChange} open={open}>
      <SheetTrigger asChild>
        <Button
          aria-label={hasKnownUser ? `Account: ${auth.user?.email}` : 'Sign in to sync'}
          disabled={isDisabled}
          title={triggerTitle(auth.status, auth.user?.email)}
          type="button"
          variant="outline"
        >
          {hasKnownUser ? (
            <AccountInitials email={auth.user?.email ?? ''} />
          ) : isChecking ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <LogIn className="size-4" />
          )}
          <span className="hidden max-w-48 truncate sm:inline">
            {hasKnownUser ? auth.user?.email : isChecking ? 'Checking' : 'Sign in to sync'}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="left-auto right-0 w-full max-w-none border-l border-r-0 bg-card text-card-foreground shadow-2xl sm:max-w-[28rem]">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === 'signin' && (
            <GitHubStep
              deviceSummary={deviceSummary}
              error={error}
              isWorking={isWorking}
              onClose={closeSheet}
              onSignIn={() => void signInWithGitHub()}
            />
          )}
          {step === 'progress' && progress.handoff && (
            <ProgressStep
              error={error}
              handoff={progress.handoff}
              onMove={() => void moveAndContinue()}
              onUseAccount={useAccountProgress}
            />
          )}
          {step === 'account' && auth.user && (
            <AccountStep
              email={auth.user.email}
              error={error}
              isWorking={isWorking}
              onSignOut={() => void beginSignOut(false)}
              onSignOutEverywhere={() => void beginSignOut(true)}
              syncStatus={progress.syncStatus}
            />
          )}
          {step === 'signout-warning' && (
            <SignOutWarning
              error={error}
              isWorking={isWorking}
              onDiscard={() => void finishSignOut(signOutEverywhere)}
              onKeepLearning={closeSheet}
              onRetry={() => void beginSignOut(signOutEverywhere)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function GitHubStep({
  deviceSummary,
  error,
  isWorking,
  onClose,
  onSignIn,
}: {
  deviceSummary: ProgressSummary
  error?: string
  isWorking: boolean
  onClose: () => void
  onSignIn: () => void
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="p-6 pt-14">
        <SheetTitle className="text-2xl tracking-tight">
          Your work can follow you
        </SheetTitle>
        <SheetDescription className="mt-2 leading-6">
          Keep learning as a guest, or connect GitHub and use the same progress
          on another device.
        </SheetDescription>
        <div className="mt-7 overflow-hidden rounded-lg border">
          <SummaryRow
            detail="Available without an account"
            label="On this device"
            summary={deviceSummary}
          />
          <div className="border-t bg-muted/50 p-4">
            <p className="text-sm font-medium">After sign-in</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Choose whether to move this work or keep the progress already
              saved to your account.
            </p>
          </div>
        </div>
        <InlineError message={error} />
        <Button
          autoFocus
          className="mt-6 w-full"
          disabled={isWorking}
          onClick={onSignIn}
          type="button"
        >
          {isWorking ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Github aria-hidden="true" className="size-4" />
          )}
          Connect GitHub
        </Button>
        <Button
          className="mt-2 w-full"
          onClick={onClose}
          type="button"
          variant="ghost"
        >
          Keep learning locally
        </Button>
      </div>
      <p className="mt-auto border-t p-6 text-xs leading-5 text-muted-foreground">
        GitHub provides your name and email. Code Trainer never asks for
        repository access.
      </p>
    </div>
  )
}

function ProgressStep({
  error,
  handoff,
  onMove,
  onUseAccount,
}: {
  error?: string
  handoff: ProgressHandoff
  onMove: () => void
  onUseAccount: () => void
}) {
  return (
    <div>
      <StepRail />
      <div className="p-6">
        <SheetTitle className="text-2xl tracking-tight">Choose what follows you</SheetTitle>
        <SheetDescription className="mt-2 leading-6">
          Your account and this device both have learning history. Individual
          answers are merged using their latest save time.
        </SheetDescription>
        <div className="mt-5 overflow-hidden rounded-lg border">
          <SummaryRow label="This device" summary={handoff.device} />
          <SummaryRow className="border-t" label="Your account" summary={handoff.account} />
        </div>
        <InlineError message={error} />
        <Button
          className="mt-5 w-full"
          disabled={handoff.isSaving}
          onClick={onMove}
          type="button"
        >
          {handoff.isSaving && <LoaderCircle className="size-4 animate-spin" />}
          Move and continue
        </Button>
        <Button
          className="mt-2 w-full"
          disabled={handoff.isSaving}
          onClick={onUseAccount}
          type="button"
          variant="outline"
        >
          Use account progress
        </Button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Device progress remains untouched until the account save succeeds.
        </p>
      </div>
    </div>
  )
}

function AccountStep({
  email,
  error,
  isWorking,
  onSignOut,
  onSignOutEverywhere,
  syncStatus,
}: {
  email: string
  error?: string
  isWorking: boolean
  onSignOut: () => void
  onSignOutEverywhere: () => void
  syncStatus: SyncStatus
}) {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-semibold text-primary-foreground">
          {initials(email)}
        </span>
        <div className="min-w-0">
          <SheetTitle className="truncate">{email}</SheetTitle>
          <SheetDescription className="mt-0.5">
            {syncStatusLabel(syncStatus)}
          </SheetDescription>
        </div>
      </div>
      <div className="mt-6 rounded-lg border p-4">
        <div className="flex items-center justify-between text-sm">
          <span>Cloud progress</span>
          <span className="text-primary">{syncStatus === 'synced' ? 'Current' : 'Local copy safe'}</span>
        </div>
      </div>
      <InlineError message={error} />
      <div className="mt-5 grid gap-1">
        <Button
          className="justify-start"
          disabled={isWorking}
          onClick={onSignOut}
          type="button"
          variant="ghost"
        >
          Sign out on this device
        </Button>
        <Button
          className="justify-start"
          disabled={isWorking}
          onClick={onSignOutEverywhere}
          type="button"
          variant="ghost"
        >
          Sign out on all devices
        </Button>
      </div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">
        This browser stays signed in for 30 days after your last visit.
      </p>
    </div>
  )
}

function SignOutWarning({
  error,
  isWorking,
  onDiscard,
  onKeepLearning,
  onRetry,
}: {
  error?: string
  isWorking: boolean
  onDiscard: () => void
  onKeepLearning: () => void
  onRetry: () => void
}) {
  return (
    <div className="p-6">
      <Badge className="border-destructive/30 bg-destructive/10 text-destructive" variant="outline">
        <TriangleAlert className="mr-1 size-3" /> Save interrupted
      </Badge>
      <SheetTitle className="mt-4 text-2xl tracking-tight">Keep your latest work?</SheetTitle>
      <SheetDescription className="mt-2 leading-6">
        Some local progress has not reached your account. Retry before signing
        out, or discard the unsynced account copy.
      </SheetDescription>
      <InlineError message={error} />
      <Button className="mt-5 w-full" disabled={isWorking} onClick={onRetry} type="button">
        {isWorking && <LoaderCircle className="size-4 animate-spin" />}
        Retry save
      </Button>
      <Button
        className="mt-2 w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={isWorking}
        onClick={onDiscard}
        type="button"
        variant="outline"
      >
        Sign out and discard unsynced changes
      </Button>
      <Button className="mt-2 w-full" onClick={onKeepLearning} type="button" variant="ghost">
        Keep learning
      </Button>
    </div>
  )
}

function StepRail() {
  return (
    <div className="border-b p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RailDone label="GitHub" />
        <span className="h-px flex-1 bg-primary" />
        <RailCurrent label="2" name="Progress" />
      </div>
    </div>
  )
}

function RailDone({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
        <CircleCheck className="size-3" />
      </span>
      {label}
    </span>
  )
}

function RailCurrent({ label, name }: { label: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-foreground">
      <span className="grid size-5 place-items-center rounded-full border border-primary text-primary">
        {label}
      </span>
      {name}
    </span>
  )
}

function SummaryRow({
  className = '',
  detail,
  label,
  summary,
}: {
  className?: string
  detail?: string
  label: string
  summary: ProgressSummary
}) {
  return (
    <div className={`flex items-center justify-between gap-4 p-4 text-sm ${className}`}>
      <div>
        <span>{label}</span>
        {detail && (
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        )}
      </div>
      <strong className="text-right">{summaryLabel(summary)}</strong>
    </div>
  )
}

function InlineError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className="mt-4 border-l-2 border-destructive bg-muted p-3 text-sm"
      role="alert"
    >
      {message}
    </div>
  )
}

function AccountInitials({ email }: { email: string }) {
  return (
    <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
      {initials(email)}
    </span>
  )
}

function initials(email: string) {
  const localPart = email.split('@')[0] ?? ''
  const letters = localPart.replace(/[^a-z0-9]/gi, '').slice(0, 2)

  return letters.toUpperCase() || <UserRound className="size-3" />
}

function summaryLabel(summary: ProgressSummary, emptyLabel = 'No saved work') {
  const parts: string[] = []

  if (summary.completedProblems > 0) {
    parts.push(`${summary.completedProblems} complete`)
  }
  if (summary.drafts > 0) {
    parts.push(`${summary.drafts} ${summary.drafts === 1 ? 'draft' : 'drafts'}`)
  }
  if (summary.savedAnswers > 0) {
    parts.push(`${summary.savedAnswers} saved`)
  }

  return (
    parts.join(' · ') || (summary.hasMeaningfulWork ? 'Saved activity' : emptyLabel)
  )
}

function syncStatusLabel(status: SyncStatus) {
  if (status === 'synced') {
    return 'Synced just now'
  }
  if (status === 'syncing' || status === 'loading-cloud') {
    return 'Syncing progress'
  }
  if (status === 'failed') {
    return 'Cloud sync needs attention'
  }
  return 'Progress saved locally'
}

function triggerTitle(status: ReturnType<typeof useAppAuth>['status'], email?: string) {
  if (email) {
    return `Open account for ${email}`
  }
  if (status === 'unconfigured') {
    return 'Set VITE_CONVEX_URL and the auth proxy to enable account sync.'
  }
  if (status === 'loading' || status === 'refreshing') {
    return 'Checking authentication state.'
  }
  return 'Sign in to sync progress across devices.'
}

function toAuthActionError(error: unknown) {
  return error instanceof AuthActionError
    ? error
    : new AuthActionError('The request could not be completed.')
}
