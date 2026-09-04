export const appEnv = {
  convexUrl: import.meta.env.VITE_CONVEX_URL,
}

export const isConvexConfigured = Boolean(appEnv.convexUrl)
