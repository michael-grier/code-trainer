import { APIError } from 'better-auth/api'

import { internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'

const RESEND_EMAIL_URL = 'https://api.resend.com/emails'
const textEncoder = new TextEncoder()

type AuthEmail = {
  email: string
  otp: string
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email'
}

type EmailActionContext = Pick<ActionCtx, 'runMutation'>

export async function sendAuthEmail(message: AuthEmail) {
  if (message.type !== 'sign-in') {
    throw new APIError('BAD_REQUEST', {
      code: 'UNSUPPORTED_EMAIL_CODE_TYPE',
      message: 'This email code flow is unavailable.',
    })
  }

  if (!/^\d{8}$/.test(message.otp)) {
    throw new Error('Better Auth generated an invalid email code.')
  }

  const config = getEmailConfig()
  const normalizedEmail = message.email.trim().toLowerCase()
  const deliveryCorrelationId = crypto.randomUUID()
  const idempotencyKey = await createPrivateDigest(
    config.secret,
    `email-delivery:${normalizedEmail}:${message.otp}`,
  )
  let response: Response

  try {
    response = await fetch(RESEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `auth-${idempotencyKey}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [normalizedEmail],
        subject: 'Your Code Trainer sign-in code',
        text: createTextEmail(message.otp),
        html: createHtmlEmail(message.otp),
      }),
    })
  } catch {
    reportDeliveryFailure(deliveryCorrelationId)
    throw emailUnavailableError()
  }

  if (!response.ok) {
    reportDeliveryFailure(deliveryCorrelationId, response.status)
    throw emailUnavailableError()
  }
}

export async function enforceAuthEmailRateLimit(
  ctx: EmailActionContext,
  email: string,
) {
  const normalizedEmail = email.trim().toLowerCase()
  const emailKey = await createPrivateAuthKey(
    `email-rate-limit:${normalizedEmail}`,
  )
  const rateLimit = await ctx.runMutation(
    internal.authRateLimit.consumeAuthEmailSend,
    { key: emailKey },
  )

  if (!rateLimit.allowed) {
    throw new APIError(
      'TOO_MANY_REQUESTS',
      {
        code: 'AUTH_EMAIL_RATE_LIMITED',
        message: 'Please wait before requesting another code.',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
      },
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    )
  }
}

export function createPrivateAuthKey(value: string) {
  return createPrivateDigest(
    requireEnvironmentValue('BETTER_AUTH_SECRET'),
    value,
  )
}

function getEmailConfig() {
  const secret = requireEnvironmentValue('BETTER_AUTH_SECRET')
  const apiKey = requireEnvironmentValue('RESEND_API_KEY')
  const from = requireEnvironmentValue('AUTH_EMAIL_FROM')

  if (secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters.')
  }

  if (/[\r\n]/.test(apiKey) || /[\r\n]/.test(from) || from.length > 320) {
    throw new Error('Auth email environment configuration is invalid.')
  }

  return { secret, apiKey, from }
}

function requireEnvironmentValue(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is required to send authentication email.`)
  }

  return value
}

async function createPrivateDigest(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(value),
  )

  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}

function createTextEmail(otp: string) {
  return `Your Code Trainer sign-in code is ${otp}. It expires in 5 minutes. If you did not request this code, you can ignore this email.`
}

function createHtmlEmail(otp: string) {
  return `<p>Your Code Trainer sign-in code is:</p><p style="font-size: 28px; font-weight: 700; letter-spacing: 0.16em;">${otp}</p><p>It expires in 5 minutes. If you did not request this code, you can ignore this email.</p>`
}

function reportDeliveryFailure(correlationId: string, status?: number) {
  // Never include the destination address, OTP, provider body, or API key in
  // this log. The random ID is enough to correlate a user report with a try.
  console.error('Authentication email delivery failed.', {
    correlationId,
    ...(status === undefined ? {} : { status }),
  })
}

function emailUnavailableError() {
  return new APIError('SERVICE_UNAVAILABLE', {
    code: 'AUTH_EMAIL_UNAVAILABLE',
    message: 'We could not send a sign-in code. Please try again shortly.',
  })
}
