import { useAuth } from '@clerk/clerk-react'
import { CheckCircle2, CloudOff, HardDrive, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { isClerkConfigured, isConvexConfigured } from '@/lib/env'
import { useProgress } from '@/state/progressContext'

export function SyncStatus() {
  if (!isClerkConfigured) {
    return (
      <Badge title="Guest progress will be stored locally." variant="muted">
        <HardDrive className="mr-1 size-3" />
        Local progress
      </Badge>
    )
  }

  return <ConfiguredSyncStatus />
}

function ConfiguredSyncStatus() {
  const { isLoaded, isSignedIn } = useAuth()
  const { retrySync, syncStatus } = useProgress()

  if (!isLoaded) {
    return (
      <Badge title="Checking authentication state." variant="muted">
        <RefreshCw className="mr-1 size-3" />
        Checking sync
      </Badge>
    )
  }

  if (!isSignedIn) {
    return (
      <Badge title="Sign in to sync progress across devices." variant="muted">
        <HardDrive className="mr-1 size-3" />
        Local progress
      </Badge>
    )
  }

  if (!isConvexConfigured) {
    return (
      <Badge title="Set VITE_CONVEX_URL to enable cloud sync." variant="outline">
        <CloudOff className="mr-1 size-3" />
        Sync not configured
      </Badge>
    )
  }

  if (syncStatus === 'loading-cloud') {
    return (
      <Badge title="Loading cloud progress before merging." variant="muted">
        <RefreshCw className="mr-1 size-3 animate-spin" />
        Loading cloud
      </Badge>
    )
  }

  if (syncStatus === 'syncing') {
    return (
      <Badge title="Saving local changes to cloud progress." variant="outline">
        <RefreshCw className="mr-1 size-3 animate-spin" />
        Syncing
      </Badge>
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
        <CloudOff className="size-3" />
        Retry sync
      </Button>
    )
  }

  if (syncStatus === 'saved-locally') {
    return (
      <Badge title="Progress is saved locally until cloud sync is available." variant="outline">
        <HardDrive className="mr-1 size-3" />
        Saved locally
      </Badge>
    )
  }

  return (
    <Badge title="Progress is synced to your account." variant="default">
      <CheckCircle2 className="mr-1 size-3" />
      Synced
    </Badge>
  )
}
