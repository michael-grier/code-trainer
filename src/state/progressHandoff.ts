import {
  getProgressRevision,
  markProgressSynced,
  mergeProgressStates,
  progressStateToCloudSnapshot,
  type CloudProgressSnapshot,
} from '@/state/cloudProgress'
import type { ProgressState } from '@/state/progress'

type MoveProgressInput = {
  account: ProgressState
  guest: ProgressState
  saveCloud: (snapshot: CloudProgressSnapshot) => Promise<unknown>
  saveAccount: (state: ProgressState) => void
  clearGuest: () => void
}

export async function moveProgressToAccount({
  account,
  guest,
  saveCloud,
  saveAccount,
  clearGuest,
}: MoveProgressInput) {
  const merged = mergeProgressStates(account, guest)
  const revision = getProgressRevision(merged)

  await saveCloud(progressStateToCloudSnapshot(merged, revision))

  const synced = markProgressSynced(merged, revision)

  // Local cleanup follows the durable write so a failure keeps both copies.
  saveAccount(synced)
  clearGuest()
  return synced
}
