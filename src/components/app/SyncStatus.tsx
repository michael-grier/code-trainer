import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useAppAuth } from '@/state/authContext'
import { useProgress } from '@/state/progressContext'

export function SyncStatus() {
  const auth = useAppAuth()

  if (auth.status === 'unconfigured' || auth.status === 'guest') {
    return <StatusLabel title="Guest progress is stored locally.">Local</StatusLabel>
  }

  if (auth.status === 'loading') {
    return (
      <StatusLabel pulse title="Checking authentication state.">
        Checking
      </StatusLabel>
    )
  }

  if (auth.status === 'refreshing') {
    return (
      <StatusLabel pulse title="Refreshing your secure sync session.">
        Reconnecting
      </StatusLabel>
    )
  }

  if (auth.status === 'failed') {
    return (
      <StatusLabel title="Account progress is safe locally while cloud sync reconnects.">
        Saved locally
      </StatusLabel>
    )
  }

  return <AuthenticatedSyncStatus />
}

function StatusLabel({
  active,
  children,
  pulse,
  title,
}: {
  active?: boolean
  children: string
  pulse?: boolean
  title: string
}) {
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-muted-foreground"
      title={title}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          active ? 'bg-primary' : 'bg-muted-foreground/50',
          pulse && 'animate-pulse',
        )}
      />
      {children}
    </span>
  )
}

function AuthenticatedSyncStatus() {
  const { retrySync, syncStatus } = useProgress()

  if (syncStatus === 'loading-cloud' || syncStatus === 'syncing') {
    return (
      <StatusLabel pulse title="Saving local changes to cloud progress.">
        Syncing
      </StatusLabel>
    )
  }

  if (syncStatus === 'failed') {
    return (
      <Button
        className="h-7 px-2 text-xs"
        onClick={() => void retrySync()}
        title="Cloud sync failed. Retry the latest write."
        type="button"
        variant="outline"
      >
        Retry sync
      </Button>
    )
  }

  if (syncStatus === 'saved-locally') {
    return (
      <StatusLabel title="Progress is saved locally until cloud sync is available.">
        Saved locally
      </StatusLabel>
    )
  }

  return (
    <StatusLabel active title="Progress is synced to your account.">
      Synced
    </StatusLabel>
  )
}
