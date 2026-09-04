const AUTH_CHANNEL_NAME = 'code-trainer:auth'

type AuthBroadcastMessage = {
  type: 'signed-out'
  userId: string
}

type AuthBroadcastPort = {
  close: () => void
  onmessage: ((event: { data: unknown }) => void) | null
  postMessage: (message: unknown) => void
}

export type AuthChannelFactory = () => AuthBroadcastPort | undefined

export function broadcastSignedOut(
  userId: string,
  createChannel: AuthChannelFactory = openAuthChannel,
) {
  const channel = createChannel()

  if (!channel) {
    return false
  }

  try {
    channel.postMessage({
      type: 'signed-out',
      userId,
    } satisfies AuthBroadcastMessage)
    return true
  } catch {
    return false
  } finally {
    channel.close()
  }
}

export function listenForSignedOut(
  onSignedOut: (userId: string) => void,
  createChannel: AuthChannelFactory = openAuthChannel,
) {
  const channel = createChannel()

  if (!channel) {
    return () => undefined
  }

  channel.onmessage = (event) => {
    const message = parseAuthBroadcastMessage(event.data)

    if (message) {
      onSignedOut(message.userId)
    }
  }

  return () => {
    channel.onmessage = null
    channel.close()
  }
}

export function parseAuthBroadcastMessage(
  value: unknown,
): AuthBroadcastMessage | undefined {
  if (!isRecord(value) || value.type !== 'signed-out') {
    return undefined
  }

  return typeof value.userId === 'string' && value.userId.length > 0
    ? { type: 'signed-out', userId: value.userId }
    : undefined
}

function openAuthChannel(): AuthBroadcastPort | undefined {
  if (typeof BroadcastChannel === 'undefined') {
    return undefined
  }

  const channel = new BroadcastChannel(AUTH_CHANNEL_NAME)
  const port: AuthBroadcastPort = {
    close: () => channel.close(),
    onmessage: null,
    postMessage: (message) => channel.postMessage(message),
  }
  channel.onmessage = (event) => port.onmessage?.({ data: event.data })

  return port
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
