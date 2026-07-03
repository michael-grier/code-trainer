import { useAuth } from '@clerk/clerk-react'
import { Cloud, CloudOff, HardDrive, RefreshCw } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { isClerkConfigured, isConvexConfigured } from '@/lib/env'

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

  return (
    <Badge title="Cloud progress sync will be wired in checkpoint 5." variant="outline">
      <Cloud className="mr-1 size-3" />
      Sync ready
    </Badge>
  )
}

