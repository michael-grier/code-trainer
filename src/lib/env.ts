export const appEnv = {
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  convexUrl: import.meta.env.VITE_CONVEX_URL,
}

export const isClerkConfigured = Boolean(appEnv.clerkPublishableKey)
export const isConvexConfigured = Boolean(appEnv.convexUrl)

