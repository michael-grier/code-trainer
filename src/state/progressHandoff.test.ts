import { describe, expect, it, vi } from 'vitest'

import {
  createEmptyProgressState,
  getDraftKey,
  getUpdatedAtKey,
} from '@/state/progress'
import { moveProgressToAccount } from '@/state/progressHandoff'

function progressWithDraft(value: string, updatedAt: number) {
  const state = createEmptyProgressState(0)
  const key = getDraftKey('arrays-and-hashing', 'practice')

  state.drafts[key] = value
  state.updatedAt[
    getUpdatedAtKey('drafts', 'arrays-and-hashing', 'practice')
  ] = updatedAt
  return state
}

describe('progress handoff transaction', () => {
  it('persists the merged snapshot before replacing or clearing local copies', async () => {
    const events: string[] = []
    const saveAccount = vi.fn(() => events.push('save-account'))
    const clearGuest = vi.fn(() => events.push('clear-guest'))

    const result = await moveProgressToAccount({
      account: progressWithDraft('account version', 100),
      guest: progressWithDraft('newer device version', 200),
      saveCloud: async (snapshot) => {
        events.push('save-cloud')
        expect(snapshot.problems[0].draft).toBe('newer device version')
      },
      saveAccount,
      clearGuest,
    })

    expect(events).toEqual(['save-cloud', 'save-account', 'clear-guest'])
    expect(result.drafts['arrays-and-hashing::practice']).toBe(
      'newer device version',
    )
    expect(result.lastSyncedAt).toBe(200)
  })

  it('keeps both local copies when the cloud write fails', async () => {
    const saveAccount = vi.fn()
    const clearGuest = vi.fn()

    await expect(
      moveProgressToAccount({
        account: progressWithDraft('account version', 100),
        guest: progressWithDraft('device version', 200),
        saveCloud: async () => {
          throw new Error('offline')
        },
        saveAccount,
        clearGuest,
      }),
    ).rejects.toThrow('offline')
    expect(saveAccount).not.toHaveBeenCalled()
    expect(clearGuest).not.toHaveBeenCalled()
  })
})
