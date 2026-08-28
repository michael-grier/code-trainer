import { runTypeCheck, type LibFileMap, type TypeCheckInput } from './typeGrader'

export type TypeWorkerRequest = {
  type: 'check'
  requestId: string
  input: TypeCheckInput
}

export type TypeWorkerResponse =
  | {
      type: 'result'
      requestId: string
      result: ReturnType<typeof runTypeCheck>
    }
  | {
      type: 'error'
      requestId: string
      error: string
    }

// Bundle the ES lib chain and decorator libs as raw text so the compiler can
// resolve its default library inside the worker. DOM libs are intentionally
// absent: graded problems are plain TypeScript, and the fixed compiler
// options only request lib.es2022.
const bundledLibModules = {
  ...import.meta.glob('/node_modules/typescript/lib/lib.es*.d.ts', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
  ...import.meta.glob('/node_modules/typescript/lib/lib.decorators*.d.ts', {
    eager: true,
    query: '?raw',
    import: 'default',
  }),
} as Record<string, string>

const libFiles: LibFileMap = Object.fromEntries(
  Object.entries(bundledLibModules).map(([path, source]) => [
    path.slice(path.lastIndexOf('/') + 1),
    source,
  ]),
)

self.addEventListener('message', (event: MessageEvent<TypeWorkerRequest>) => {
  const request = event.data

  if (request.type !== 'check') {
    return
  }

  try {
    const result = runTypeCheck(request.input, libFiles)
    const response: TypeWorkerResponse = {
      type: 'result',
      requestId: request.requestId,
      result,
    }

    self.postMessage(response)
  } catch (error) {
    const response: TypeWorkerResponse = {
      type: 'error',
      requestId: request.requestId,
      error: error instanceof Error ? error.message : 'Type check failed.',
    }

    self.postMessage(response)
  }
})
