import { describe, expect, it } from 'vitest'

import {
  broadcastSignedOut,
  listenForSignedOut,
  parseAuthBroadcastMessage,
  type AuthChannelFactory,
} from '@/state/authBroadcast'

function createTestBus() {
  const ports = new Set<{
    close: () => void
    onmessage: ((event: { data: unknown }) => void) | null
    postMessage: (message: unknown) => void
  }>()
  const createChannel: AuthChannelFactory = () => {
    const port = {
      close: () => ports.delete(port),
      onmessage: null as ((event: { data: unknown }) => void) | null,
      postMessage: (message: unknown) => {
        for (const peer of ports) {
          if (peer !== port) {
            peer.onmessage?.({ data: message })
          }
        }
      },
    }
    ports.add(port)
    return port
  }

  return { createChannel, ports }
}

describe('auth tab coordination', () => {
  it('broadcasts a signed-out account to other listeners', () => {
    const bus = createTestBus()
    const received: string[] = []
    const stop = listenForSignedOut(
      (userId) => received.push(userId),
      bus.createChannel,
    )

    expect(broadcastSignedOut('user-one', bus.createChannel)).toBe(true)
    expect(received).toEqual(['user-one'])

    stop()
    expect(bus.ports.size).toBe(0)
  })

  it('ignores malformed or unrelated channel messages', () => {
    expect(parseAuthBroadcastMessage(null)).toBeUndefined()
    expect(
      parseAuthBroadcastMessage({ type: 'signed-out', userId: '' }),
    ).toBeUndefined()
    expect(
      parseAuthBroadcastMessage({ type: 'signed-in', userId: 'user-one' }),
    ).toBeUndefined()
  })
})
