import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { emailOTPClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

function getBrowserOrigin() {
  return typeof window === 'undefined' ? 'http://localhost' : window.location.origin
}

export const authClient = createAuthClient({
  baseURL: getBrowserOrigin(),
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [convexClient(), emailOTPClient()],
})
