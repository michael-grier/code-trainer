import { createClient, type GenericCtx } from '@convex-dev/better-auth'
import { convex } from '@convex-dev/better-auth/plugins'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal'
import { emailOTP } from 'better-auth/plugins/email-otp'
import { ConvexError, v } from 'convex/values'

import { components, internal } from './_generated/api'
import type { DataModel } from './_generated/dataModel'
import { query } from './_generated/server'
import authConfig from './auth.config'
import {
  createPrivateAuthKey,
  enforceAuthEmailRateLimit,
  sendAuthEmail,
} from './email'

const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 30
const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24

export const authComponent = createClient<DataModel>(components.betterAuth)

export async function requireAuthUserId(ctx: GenericCtx<DataModel>) {
  const user = await authComponent.safeGetAuthUser(ctx)

  if (!user) {
    throw new ConvexError({ code: 'AUTH_REQUIRED' })
  }

  return user._id
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  const siteOrigin = getSiteOrigin()
  const options = {
    appName: 'Code Trainer',
    baseURL: siteOrigin,
    secret: getAuthSecret(),
    trustedOrigins: [siteOrigin],
    database: authComponent.adapter(ctx),
    session: {
      expiresIn: SESSION_EXPIRES_IN_SECONDS,
      updateAge: SESSION_UPDATE_AGE_SECONDS,
      deferSessionRefresh: true,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
      customRules: {
        '/email-otp/send-verification-otp': { window: 60, max: 3 },
        '/sign-in/email-otp': { window: 300, max: 5 },
      },
      customStorage: {
        get: async (key) =>
          ctx.runQuery(internal.authRateLimit.getAuthRequestRateLimit, {
            key: await createPrivateAuthKey(`request-rate-limit:${key}`),
          }),
        set: async (key, value) => {
          if (!('runMutation' in ctx)) {
            throw new Error(
              'Auth request rate limiting requires a mutation context.',
            )
          }

          await ctx.runMutation(internal.authRateLimit.setAuthRequestRateLimit, {
            key: await createPrivateAuthKey(`request-rate-limit:${key}`),
            count: value.count,
            lastRequest: value.lastRequest,
          })
        },
        consume: async (key, rule) => {
          if (!('runMutation' in ctx)) {
            throw new Error(
              'Auth request rate limiting requires a mutation context.',
            )
          }

          return ctx.runMutation(
            internal.authRateLimit.consumeAuthRequestRateLimit,
            {
              key: await createPrivateAuthKey(`request-rate-limit:${key}`),
              windowSeconds: rule.window,
              max: rule.max,
            },
          )
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (request) => {
        if (request.path !== '/email-otp/send-verification-otp') {
          return
        }

        const email = getRequestEmail(request.body)

        if (!email) {
          return
        }
        if (!('runMutation' in ctx)) {
          throw new APIError('INTERNAL_SERVER_ERROR', {
            code: 'AUTH_EMAIL_CONTEXT_UNAVAILABLE',
            message: 'Authentication email is temporarily unavailable.',
          })
        }

        // Run before OTP generation because delivery callback errors are
        // intentionally swallowed by Better Auth.
        await enforceAuthEmailRateLimit(ctx, email)
      }),
    },
    advanced: {
      cookiePrefix: 'code_trainer',
      defaultCookieAttributes: {
        httpOnly: true,
        path: '/',
        sameSite: 'strict',
        secure: siteOrigin.startsWith('https:'),
      },
      ipAddress: {
        // The first-party host must overwrite this header at the edge. Direct
        // browser values are never trusted by the application proxy.
        ipAddressHeaders: ['x-real-ip'],
      },
      trustedProxyHeaders: false,
    },
    plugins: [
      emailOTP({
        otpLength: 8,
        expiresIn: 5 * 60,
        allowedAttempts: 5,
        resendStrategy: 'rotate',
        storeOTP: 'hashed',
        rateLimit: { window: 60, max: 3 },
        sendVerificationOTP: async (message) => {
          await sendAuthEmail(message)
        },
      }),
      convex({ authConfig }),
    ],
  } satisfies BetterAuthOptions

  return betterAuth(options)
}

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      id: v.string(),
      email: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)

    return user ? { id: user._id, email: user.email } : null
  },
})

function getSiteOrigin() {
  const configuredUrl = process.env.SITE_URL

  if (!configuredUrl) {
    throw new Error('SITE_URL is required for authentication.')
  }

  const url = new URL(configuredUrl)
  const localHosts = new Set(['localhost', '127.0.0.1', '[::1]'])
  const isHttps = url.protocol === 'https:'
  const isLocalHttp = url.protocol === 'http:' && localHosts.has(url.hostname)

  if (
    (!isHttps && !isLocalHttp) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error('SITE_URL must be an HTTPS origin or a local development origin.')
  }

  return url.origin
}

function getAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.')
  }

  return secret
}

function getRequestEmail(body: unknown) {
  return isRecord(body) && typeof body.email === 'string'
    ? body.email
    : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
