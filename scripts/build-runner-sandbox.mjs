import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { build } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assetsDirectory = resolve(root, 'public/runner-assets')
const temporaryDirectory = `${assetsDirectory}-${process.pid}`

const workerEntries = {
  javascript: resolve(root, 'src/runtime/jsWorker.ts'),
  react: resolve(root, 'src/runtime/reactWorker.ts'),
  typecheck: resolve(root, 'src/runtime/typeWorker.ts'),
}

try {
  await rm(temporaryDirectory, { force: true, recursive: true })
  await mkdir(temporaryDirectory, { recursive: true })

  const workerBundles = await Promise.all(
    Object.entries(workerEntries).map(async ([runner, entry]) => [
      runner,
      await bundle(entry, 'iife'),
    ]),
  )

  await Promise.all(
    workerBundles.map(([runner, source]) =>
      writeFile(
        resolve(temporaryDirectory, `${runner}.js`),
        registerWorkerSource(runner, source),
      ),
    ),
  )

  await writeFile(
    resolve(temporaryDirectory, 'sandbox.js'),
    await bundle(resolve(root, 'src/runtime/sandboxFrame.ts'), 'iife'),
  )

  // Swap the full set at once so a running dev server never serves a worker
  // from a half-written build.
  await rm(assetsDirectory, { force: true, recursive: true })
  await rename(temporaryDirectory, assetsDirectory)
} catch (error) {
  await rm(temporaryDirectory, { force: true, recursive: true })
  throw error
}

async function bundle(entry, format) {
  const result = await build({
    root,
    configFile: false,
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    logLevel: 'error',
    resolve: {
      alias: {
        '@': resolve(root, 'src'),
      },
    },
    build: {
      emptyOutDir: false,
      minify: true,
      target: 'es2022',
      write: false,
      lib: {
        entry,
        formats: [format],
        name: 'CodeTrainerRunnerSandbox',
      },
    },
  })

  const outputs = Array.isArray(result) ? result : [result]
  for (const output of outputs) {
    if ('output' in output) {
      const chunk = output.output.find((item) => item.type === 'chunk')
      if (chunk) {
        return chunk.code
      }
    }
  }

  throw new Error(`Vite did not emit JavaScript for ${entry}.`)
}

function registerWorkerSource(runner, source) {
  const key = JSON.stringify(runner)
  const value = JSON.stringify(source)

  // The opaque frame loads this as a classic script, then creates a blob
  // worker so the worker inherits the frame's network-denying CSP.
  return `globalThis.__CODE_TRAINER_WORKER_SOURCES__ ??= {};\nglobalThis.__CODE_TRAINER_WORKER_SOURCES__[${key}] = ${value};\n`
}
