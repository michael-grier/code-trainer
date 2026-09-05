import {
  CircleCheck,
  LoaderCircle,
  LogIn,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  getCountdownSeconds,
  getSignOutReadiness,
} from '@/state/authFlow'
import { summarizeProgress, type ProgressSummary } from '@/state/cloudProgress'
import {
  useProgress,
  type ProgressHandoff,
  type SyncStatus,
} from '@/state/progressContext'

type SheetStep =
  | 'email'
  | 'code'
  | 'loading'
  | 'progress'
  | 'account'
  | 'signout-warning'

export function AuthSheet() {
  const auth = useAppAuth()
  const progress = useProgress()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<SheetStep>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [isWorking, setIsWorking] = useState(false)
  const [resendAt, setResendAt] = useState(0)
  const [signOutEverywhere, setSignOutEverywhere] = useState(false)
  const resendSeconds = useCountdown(resendAt)
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
    setCode('')
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
    if (!open || step !== 'loading') {
      return
    }

    if (progress.handoff) {
      setStep('progress')
      return
    }

    if (auth.status === 'failed' || progress.syncStatus === 'failed') {
      setError('You are signed in, but cloud progress could not reconnect yet.')
      return
    }

    if (auth.status === 'authenticated' && progress.syncStatus === 'synced') {
      closeSheet()
    }
  }, [auth.status, closeSheet, open, progress.handoff, progress.syncStatus, step])

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStep(progress.handoff ? 'progress' : hasKnownUser ? 'account' : 'email')
      setError(undefined)
      setOpen(true)
      return
    }

    closeSheet()
  }

  const requestCode = async (event?: FormEvent) => {
    event?.preventDefault()
    setError(undefined)
    setIsWorking(true)

    try {
      await auth.requestCode(email)
      setResendAt(Date.now() + 60_000)
      setStep('code')
    } catch (requestError) {
      const authError = toAuthActionError(requestError)

      if (authError.retryAfterSeconds) {
        setResendAt(Date.now() + authError.retryAfterSeconds * 1_000)
      }
      setError(getAuthErrorMessage(authError, 'send'))
    } finally {
      setIsWorking(false)
    }
  }

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault()
    setError(undefined)
    setIsWorking(true)

    try {
      await auth.verifyCode({ email, code })
      setStep('loading')
    } catch (verifyError) {
      setError(getAuthErrorMessage(toAuthActionError(verifyError), 'verify'))
    } finally {
      setIsWorking(false)
    }
  }

  const resendCode = async () => {
    if (resendSeconds > 0) {
      return
    }

    await requestCode()
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

  const changeEmail = () => {
    setCode('')
    setError(undefined)
    setStep('email')
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
          {step === 'email' && (
            <EmailStep
              deviceSummary={deviceSummary}
              email={email}
              error={error}
              isWorking={isWorking}
              onClose={closeSheet}
              onEmailChange={setEmail}
              onSubmit={requestCode}
            />
          )}
          {step === 'code' && (
            <CodeStep
              code={code}
              email={email}
              error={error}
              isWorking={isWorking}
              onChangeCode={setCode}
              onChangeEmail={changeEmail}
              onResend={() => void resendCode()}
              onSubmit={verifyCode}
              resendSeconds={resendSeconds}
            />
          )}
          {step === 'loading' && (
            <LoadingStep error={error} onClose={closeSheet} />
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

function EmailStep({
  deviceSummary,
  email,
  error,
  isWorking,
  onClose,
  onEmailChange,
  onSubmit,
}: {
  deviceSummary: ProgressSummary
  email: string
  error?: string
  isWorking: boolean
  onClose: () => void
  onEmailChange: (email: string) => void
  onSubmit: (event: FormEvent) => Promise<void>
}) {
  return (
    <form className="p-6" onSubmit={(event) => void onSubmit(event)}>
      <Badge variant="muted">{summaryLabel(deviceSummary, 'On this device')}</Badge>
      <SheetTitle className="mt-5 text-2xl tracking-tight">
        Carry this progress with you
      </SheetTitle>
      <SheetDescription className="mt-2 leading-6">
        Enter your email and we will send one sign-in code. Every lesson stays
        available without an account.
      </SheetDescription>
      <label className="mt-7 block text-sm font-medium" htmlFor="auth-email">
        Email
      </label>
      <Input
        autoComplete="email"
        autoFocus
        className="mt-2"
        id="auth-email"
        onChange={(event) => onEmailChange(event.target.value)}
        placeholder="you@example.com"
        required
        type="email"
        value={email}
      />
      <InlineError message={error} />
      <Button className="mt-4 w-full" disabled={isWorking} type="submit">
        {isWorking && <LoaderCircle className="size-4 animate-spin" />}
        Email me a code
      </Button>
      <Button className="mt-2 w-full" onClick={onClose} type="button" variant="ghost">
        Not now
      </Button>
    </form>
  )
}

function CodeStep({
  code,
  email,
  error,
  isWorking,
  onChangeCode,
  onChangeEmail,
  onResend,
  onSubmit,
  resendSeconds,
}: {
  code: string
  email: string
  error?: string
  isWorking: boolean
  onChangeCode: (code: string) => void
  onChangeEmail: () => void
  onResend: () => void
  onSubmit: (event: FormEvent) => Promise<void>
  resendSeconds: number
}) {
  return (
    <form onSubmit={(event) => void onSubmit(event)}>
      <StepRail />
      <div className="p-6">
        <SheetTitle className="text-2xl tracking-tight">Enter your code</SheetTitle>
        <SheetDescription className="mt-2 leading-6">
          Sent to <span className="font-medium text-foreground">{email}</span>.{' '}
          <button
            className="rounded-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            onClick={onChangeEmail}
            type="button"
          >
            Change email
          </button>
        </SheetDescription>
        <label className="mt-6 block text-sm font-medium" htmlFor="auth-code">
          8-digit code
        </label>
        <Input
          aria-describedby="auth-code-help"
          autoComplete="one-time-code"
          autoFocus
          className="mt-2 h-12 text-center text-xl tracking-[0.35em]"
          id="auth-code"
          inputMode="numeric"
          onChange={(event) =>
            onChangeCode(event.target.value.replace(/\D/g, '').slice(0, 8))
          }
          pattern="[0-9]{8}"
          required
          value={code}
        />
        <InlineError message={error} />
        <Button
          className="mt-4 w-full"
          disabled={isWorking || code.length !== 8}
          type="submit"
        >
          {isWorking && <LoaderCircle className="size-4 animate-spin" />}
          Verify code
        </Button>
        <div className="mt-5 flex items-start gap-3 border-t pt-5" id="auth-code-help">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">This browser will remember you</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              The 30-day session renews while you are active. On a shared
              computer, use private browsing or sign out when finished.
            </p>
          </div>
        </div>
        <Button
          className="mt-4 w-full text-xs"
          disabled={isWorking || resendSeconds > 0}
          onClick={onResend}
          type="button"
          variant="ghost"
        >
          {resendSeconds > 0
            ? `Resend available in ${resendSeconds} seconds`
            : 'Send a new code'}
        </Button>
      </div>
    </form>
  )
}

function LoadingStep({ error, onClose }: { error?: string; onClose: () => void }) {
  return (
    <div className="p-8">
      <div className="flex items-start gap-4">
        <LoaderCircle className="mt-0.5 size-6 shrink-0 animate-spin text-primary" />
        <div>
          <SheetTitle>Reconnecting cloud progress</SheetTitle>
          <SheetDescription className="mt-1">
            Local work remains available while the secure session is checked.
          </SheetDescription>
        </div>
      </div>
      <div className="mt-8 grid gap-3" aria-hidden="true">
        <div className="h-14 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
      </div>
      <InlineError message={error} />
      {error && (
        <Button className="mt-4 w-full" onClick={onClose} type="button" variant="outline">
          Keep learning locally
        </Button>
      )}
      <p className="mt-5 text-xs text-muted-foreground">
        Checking session · Refreshing access · Loading progress
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
      <StepRail progress />
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

function StepRail({ progress = false }: { progress?: boolean }) {
  return (
    <div className="border-b p-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RailDone label="Email" />
        <span className="h-px flex-1 bg-primary" />
        {progress ? <RailDone label="Code" /> : <RailCurrent label="2" name="Code" />}
        <span className={`h-px flex-1 ${progress ? 'bg-primary' : 'bg-border'}`} />
        {progress ? <RailCurrent label="3" name="Progress" /> : <RailFuture label="3" name="Progress" />}
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

function RailFuture({ label, name }: { label: string; name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="grid size-5 place-items-center rounded-full border">{label}</span>
      {name}
    </span>
  )
}

function SummaryRow({
  className = '',
  label,
  summary,
}: {
  className?: string
  label: string
  summary: ProgressSummary
}) {
  return (
    <div className={`flex items-center justify-between gap-4 p-4 text-sm ${className}`}>
      <span>{label}</span>
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

function useCountdown(deadline: number) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const update = () => {
      setSeconds(getCountdownSeconds(deadline))
    }

    update()

    if (deadline <= Date.now()) {
      return
    }

    const timer = window.setInterval(update, 1_000)
    return () => window.clearInterval(timer)
  }, [deadline])

  return seconds
}
