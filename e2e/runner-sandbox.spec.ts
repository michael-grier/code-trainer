import { expect, test, type Page } from '@playwright/test'

type CodeRunInput = {
  code: string
  functionName: string
  tests: Array<{ name: string; args: unknown[]; expected: unknown }>
  timeoutMs?: number
}

type CodeRunResult = {
  status: 'passed' | 'failed' | 'error' | 'timeout'
  logs: Array<{ method: string; values: string[] }>
}

type ReactRunInput = {
  code: string
  componentName: string
  tests: Array<{
    name: string
    steps?: Array<
      | { action: 'click'; text: string }
      | { action: 'type'; into: string; value: string }
    >
    expect: Array<{
      type: 'text-present' | 'text-absent'
      text: string
    }>
  }>
}

type TypeCheckInput = {
  code: string
  typeFixture?: string
}

type TypeCheckResult = {
  passed: boolean
  diagnostics: unknown[]
}

type RunnerTestBridge = {
  runCode: (input: CodeRunInput) => Promise<CodeRunResult>
  runReactTests: (input: ReactRunInput) => Promise<CodeRunResult>
  runTypeCheckInWorker: (
    input: TypeCheckInput,
  ) => Promise<TypeCheckResult | { error: string }>
}

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/fixtures/runner.html')
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
})

test('runs JavaScript, React, type checks, and timeouts inside the sandbox', async ({
  page,
}) => {
  const javascriptResult = await runCode(page, {
    code: `
      console.info('runner ready')
      export function add(left, right) { return left + right }
    `,
    functionName: 'add',
    tests: [{ name: 'adds values', args: [2, 3], expected: 5 }],
  })
  expect(javascriptResult.status).toBe('passed')
  expect(javascriptResult.logs).toEqual([
    { method: 'info', values: ['"runner ready"'] },
  ])

  const reactResult = await runReact(page, {
    code: `
      import { useState } from 'react'
      export function Counter() {
        const [count, setCount] = useState(0)
        return <button onClick={() => setCount(count + 1)}>Count {count}</button>
      }
    `,
    componentName: 'Counter',
    tests: [
      {
        name: 'increments the counter',
        expect: [{ type: 'text-present', text: 'Count 1' }],
        steps: [{ action: 'click', text: 'Count 0' }],
      },
    ],
  })
  expect(reactResult.status).toBe('passed')

  const typeCheckResult = await runTypeCheck(page, {
    code: 'export function double(value: number) { return value * 2 }',
    typeFixture: 'const result: number = double(2)',
  })
  expect(typeCheckResult).toMatchObject({ passed: true, diagnostics: [] })

  const timeoutResult = await runCode(page, {
    code: 'export function hang() { while (true) {} }',
    functionName: 'hang',
    tests: [{ name: 'times out', args: [], expected: null }],
    timeoutMs: 200,
  })
  expect(timeoutResult).toMatchObject({ status: 'timeout' })
})

test('gives learner code an opaque origin with no storage, DOM, or network', async ({
  page,
}) => {
  const completedForbiddenRequests: string[] = []
  const failedForbiddenRequests: string[] = []
  const isForbiddenRequest = (url: string) =>
    url.includes('/api/auth/') ||
    url.includes('127.0.0.1:4174') ||
    url.includes('example.com/code-trainer-exfiltration-probe')

  page.on('requestfinished', (request) => {
    const url = request.url()
    if (isForbiddenRequest(url)) {
      completedForbiddenRequests.push(url)
    }
  })
  page.on('requestfailed', (request) => {
    if (isForbiddenRequest(request.url())) {
      failedForbiddenRequests.push(request.failure()?.errorText ?? 'unknown')
    }
  })

  const result = await runCode(page, {
    code: `
      async function rejects(action) {
        try {
          await action()
          return false
        } catch {
          return true
        }
      }

      async function connectionFails(createConnection) {
        try {
          const connection = createConnection()
          return await new Promise((resolve) => {
            let settled = false
            const finish = (blocked) => {
              if (settled) return
              settled = true
              connection.close()
              resolve(blocked)
            }
            connection.addEventListener('open', () => finish(false))
            connection.addEventListener('error', () => finish(true))
            setTimeout(() => finish(true), 300)
          })
        } catch {
          return true
        }
      }

      async function indexedDbFails() {
        if (typeof indexedDB === 'undefined') return true
        return rejects(() => new Promise((resolve, reject) => {
          const request = indexedDB.open('code-trainer-sandbox-probe')
          request.onsuccess = () => {
            request.result.close()
            resolve()
          }
          request.onerror = () => reject(request.error)
        }))
      }

      export async function probe() {
        return {
          cookies: typeof document === 'undefined',
          localStorage: typeof localStorage === 'undefined',
          sessionStorage: typeof sessionStorage === 'undefined',
          indexedDb: await indexedDbFails(),
          parentDom: typeof parent === 'undefined',
          authSession: await rejects(() => fetch('http://127.0.0.1:5173/api/auth/get-session')),
          authToken: await rejects(() => fetch('http://127.0.0.1:5173/api/auth/convex/token')),
          convexHttp: await rejects(() => fetch('http://127.0.0.1:4174/health')),
          externalHttp: await rejects(() => fetch('https://example.com/code-trainer-exfiltration-probe')),
          externalScript: await rejects(async () => importScripts('https://example.com/code-trainer-exfiltration-probe?via=script')),
          dynamicImport: await rejects(() => import('https://example.com/code-trainer-exfiltration-probe?via=import')),
          websocket: typeof WebSocket === 'undefined' || await connectionFails(() => new WebSocket('ws://127.0.0.1:4174')),
          eventSource: typeof EventSource === 'undefined' || await connectionFails(() => new EventSource('http://127.0.0.1:4174/events')),
          popup: typeof open === 'undefined',
          navigation: typeof location.assign === 'undefined',
        }
      }
    `,
    functionName: 'probe',
    tests: [
      {
        name: 'blocks authenticated and external capabilities',
        args: [],
        expected: {
          cookies: true,
          localStorage: true,
          sessionStorage: true,
          indexedDb: true,
          parentDom: true,
          authSession: true,
          authToken: true,
          convexHttp: true,
          externalHttp: true,
          externalScript: true,
          dynamicImport: true,
          websocket: true,
          eventSource: true,
          popup: true,
          navigation: true,
        },
      },
    ],
    timeoutMs: 5_000,
  })

  expect(result).toMatchObject({ status: 'passed' })

  await page.evaluate(() => {
    document.cookie = 'runner_parent_probe=parent-cookie-secret; SameSite=Strict'
    localStorage.setItem('runner-parent-probe', 'parent-storage-secret')
    document.body.append('parent-dom-secret')
  })
  const reactResult = await runReact(page, {
    code: `
      import React from 'react'

      function storageIsBlocked() {
        try {
          return typeof localStorage === 'undefined' || localStorage.getItem('runner-parent-probe') === null
        } catch {
          return true
        }
      }

      export function IsolationProbe() {
        const cookieBlocked = !String(document.cookie ?? '').includes('parent-cookie-secret')
        const parentDomBlocked = typeof parent === 'undefined' && !document.body.textContent.includes('parent-dom-secret')
        const isolated = cookieBlocked && parentDomBlocked && storageIsBlocked()
        return <p>{isolated ? 'React runner isolated' : 'React runner exposed'}</p>
      }
    `,
    componentName: 'IsolationProbe',
    tests: [
      {
        name: 'cannot reach parent state or storage',
        expect: [{ type: 'text-present', text: 'React runner isolated' }],
      },
    ],
  })
  expect(reactResult.status).toBe('passed')

  expect(completedForbiddenRequests).toEqual([])
  expect(failedForbiddenRequests.every((error) => error.includes('csp'))).toBe(
    true,
  )

  const iframe = page.locator('iframe[data-code-trainer-runner]')
  await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts')
  await expect(iframe).not.toHaveAttribute('sandbox', /allow-same-origin/)

  const sandboxFrame = page.frames().find((frame) =>
    frame.url().includes('/runner-sandbox.html'),
  )
  expect(sandboxFrame).toBeDefined()
  expect(await sandboxFrame?.evaluate(() => globalThis.origin)).toBe('null')

  const policy = await sandboxFrame
    ?.locator('meta[http-equiv="Content-Security-Policy"]')
    .getAttribute('content')
  expect(policy).toContain("connect-src 'none'")
  expect(policy).toContain('worker-src blob:')
  expect(policy).toContain("form-action 'none'")
  expect(policy).toContain("frame-src 'none'")
})

test('ignores forged worker results and rejects reused request IDs', async ({
  page,
}) => {
  const forgedResult = await runCode(page, {
    code: `
      export function double(value) {
        const nativePostMessage = globalThis.postMessage.bind(globalThis)
        nativePostMessage({
          type: 'result',
          requestId: 'forged-request-id',
          result: { status: 'passed', durationMs: 0, tests: [], logs: [] },
        })
        globalThis.postMessage = (message) => nativePostMessage({
          ...message,
          result: {
            status: 'failed',
            durationMs: 0,
            tests: [],
            logs: [],
            error: 'forged result',
          },
        })
        return value * 2
      }
    `,
    functionName: 'double',
    tests: [{ name: 'uses the harness result', args: [4], expected: 8 }],
  })
  expect(forgedResult.status).toBe('passed')

  const duplicateError = await page.evaluate(async () => {
    const nonce = 'duplicate-request-nonce'
    const iframe = document.createElement('iframe')
    iframe.hidden = true
    iframe.sandbox.add('allow-scripts')
    iframe.src = `/runner-sandbox.html#${nonce}`
    document.body.appendChild(iframe)
    await new Promise<void>((resolve) =>
      iframe.addEventListener('load', () => resolve(), { once: true }),
    )

    const channel = new MessageChannel()
    const messages: unknown[] = []
    channel.port1.addEventListener('message', (event) => messages.push(event.data))
    channel.port1.start()
    iframe.contentWindow?.postMessage(
      { type: 'connect-runner', protocolVersion: 1, nonce },
      '*',
      [channel.port2],
    )

    await waitForMessage(messages, (message) => isMessageType(message, 'ready'))

    const request = {
      type: 'execute',
      protocolVersion: 1,
      requestId: 'duplicate-request-id',
      runner: 'javascript',
      input: {
        code: 'export function pass() { return true }',
        functionName: 'pass',
        tests: [{ name: 'passes', args: [], expected: true }],
      },
    }
    channel.port1.postMessage(request)
    channel.port1.postMessage(request)

    const response = await waitForMessage(
      messages,
      (message) => isMessageType(message, 'error'),
    )
    channel.port1.close()
    iframe.remove()
    return response

    function isMessageType(value: unknown, type: string) {
      return (
        typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        value.type === type
      )
    }

    async function waitForMessage(
      values: unknown[],
      predicate: (value: unknown) => boolean,
    ) {
      const deadline = Date.now() + 5_000
      while (Date.now() < deadline) {
        const match = values.find(predicate)
        if (match) return match
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
      throw new Error('Timed out waiting for the sandbox response.')
    }
  })

  expect(duplicateError).toMatchObject({
    type: 'error',
    requestId: 'duplicate-request-id',
    error: 'Runner request IDs cannot be reused.',
  })
})

function runCode(page: Page, input: CodeRunInput) {
  return page.evaluate<CodeRunResult, CodeRunInput>(
    (runnerInput) =>
      (globalThis as unknown as { runnerTest: RunnerTestBridge }).runnerTest.runCode(
        runnerInput,
      ),
    input,
  )
}

function runReact(page: Page, input: ReactRunInput) {
  return page.evaluate<CodeRunResult, ReactRunInput>(
    (runnerInput) =>
      (globalThis as unknown as { runnerTest: RunnerTestBridge }).runnerTest.runReactTests(
        runnerInput,
      ),
    input,
  )
}

function runTypeCheck(page: Page, input: TypeCheckInput) {
  return page.evaluate<TypeCheckResult | { error: string }, TypeCheckInput>(
    (runnerInput) =>
      (globalThis as unknown as { runnerTest: RunnerTestBridge }).runnerTest.runTypeCheckInWorker(
        runnerInput,
      ),
    input,
  )
}
