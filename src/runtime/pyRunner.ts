import type { TestCase } from '@/curriculum/types'

import { formatValue } from './testHarness'
import {
  DEFAULT_PYTHON_RUN_TIMEOUT_MS,
  DEFAULT_PYODIDE_INDEX_URL,
  type CodeRunResult,
  type RuntimeWorkerInput,
  type RuntimeWorkerRequest,
  type RuntimeWorkerResponse,
  type TestRunResult,
} from './types'

export function runPythonTests(input: RuntimeWorkerInput): Promise<CodeRunResult> {
  if (typeof Worker === 'undefined') {
    return Promise.resolve({
      language: 'py',
      status: 'error',
      durationMs: 0,
      tests: [],
      logs: [],
      error: 'Web Workers are not available in this environment.',
    })
  }

  const timeoutMs = input.timeoutMs ?? DEFAULT_PYTHON_RUN_TIMEOUT_MS
  const startedAt = getNow()
  const requestId = createRequestId()
  const worker = createPythonWorker()

  return new Promise((resolve) => {
    const finish = (result: CodeRunResult) => {
      window.clearTimeout(timeoutId)
      worker.terminate()
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      finish(createTimeoutResult(input.tests, timeoutMs, getElapsedMs(startedAt)))
    }, timeoutMs)

    worker.addEventListener('message', (event: MessageEvent<RuntimeWorkerResponse>) => {
      const message = event.data

      if (message.requestId !== requestId) {
        return
      }

      if (message.type === 'result') {
        finish(message.result)
        return
      }

      finish({
        language: 'py',
        status: 'error',
        durationMs: getElapsedMs(startedAt),
        tests: [],
        logs: [],
        error: message.error,
      })
    })

    worker.addEventListener('error', (event) => {
      finish({
        language: 'py',
        status: 'error',
        durationMs: getElapsedMs(startedAt),
        tests: [],
        logs: [],
        error: event.message,
      })
    })

    const request: RuntimeWorkerRequest = {
      type: 'run',
      requestId,
      input: {
        ...input,
        pyodideIndexUrl: input.pyodideIndexUrl ?? DEFAULT_PYODIDE_INDEX_URL,
      },
    }

    worker.postMessage(request)
  })
}

function createPythonWorker() {
  const workerUrl = URL.createObjectURL(
    new Blob([PYTHON_WORKER_SOURCE], { type: 'text/javascript' }),
  )
  const worker = new Worker(workerUrl, {
    name: 'code-trainer-python-runner',
  })

  URL.revokeObjectURL(workerUrl)

  return worker
}

function createTimeoutResult(
  tests: TestCase[],
  timeoutMs: number,
  durationMs: number,
): CodeRunResult {
  return {
    language: 'py',
    status: 'timeout',
    durationMs,
    tests: tests.map<TestRunResult>((test) => ({
      name: test.name,
      status: 'timeout',
      expected: formatValue(test.expected),
      actual: '',
      durationMs: timeoutMs,
      logs: [],
      error: `Execution timed out after ${timeoutMs}ms.`,
    })),
    logs: [],
    error: `Execution timed out after ${timeoutMs}ms.`,
  }
}

function createRequestId() {
  return globalThis.crypto?.randomUUID() ?? `${Date.now()}-${Math.random()}`
}

function getNow() {
  return globalThis.performance?.now() ?? Date.now()
}

function getElapsedMs(startedAt: number) {
  return Math.max(0, Math.round(getNow() - startedAt))
}

const PYTHON_WORKER_SOURCE = `
let pyodidePromise = null;
let pendingLogs = [];

self.addEventListener('message', function (event) {
  const message = event.data;

  if (!message || message.type !== 'run') {
    return;
  }

  runPython(message)
    .then(function (result) {
      self.postMessage({
        type: 'result',
        requestId: message.requestId,
        result: result,
      });
    })
    .catch(function (error) {
      self.postMessage({
        type: 'error',
        requestId: message.requestId,
        error: errorToMessage(error),
      });
    });
});

async function runPython(message) {
  const input = message.input;
  const startedAt = getNow();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(input.functionName)) {
    throw new Error('Python function name must be a valid identifier.');
  }

  const pyodide = await loadPyodideRuntime(input.pyodideIndexUrl);

  pendingLogs = [];
  pyodide.setStdout({ batched: function (text) { appendLog('log', [text]); } });
  pyodide.setStderr({ batched: function (text) { appendLog('error', [text]); } });

  pyodide.runPython(input.code);

  const candidate = pyodide.globals.get(input.functionName);

  if (typeof candidate !== 'function') {
    destroyPyProxy(candidate);
    throw new Error('Expected Python function "' + input.functionName + '" to exist.');
  }

  destroyPyProxy(candidate);

  const loadLogs = consumeLogs();
  const tests = [];

  for (const test of input.tests) {
    consumeLogs();

    const testStartedAt = getNow();

    try {
      pyodide.globals.set('__ct_args', test.args);

      const resultProxy = pyodide.runPython(input.functionName + '(*__ct_args)');
      const actual = pyValueToJs(resultProxy);

      destroyPyProxy(resultProxy);

      const passed = deepEqual(actual, test.expected);

      tests.push({
        name: test.name,
        status: passed ? 'passed' : 'failed',
        expected: formatValue(test.expected),
        actual: formatValue(actual),
        durationMs: getElapsedMs(testStartedAt),
        logs: consumeLogs(),
        error: passed
          ? undefined
          : 'Expected ' + formatValue(test.expected) + ', received ' + formatValue(actual) + '.',
      });
    } catch (error) {
      tests.push({
        name: test.name,
        status: 'error',
        expected: formatValue(test.expected),
        actual: '',
        durationMs: getElapsedMs(testStartedAt),
        logs: consumeLogs(),
        error: errorToMessage(error),
      });
    }
  }

  return {
    language: 'py',
    status: getStatusFromTestResults(tests),
    durationMs: getElapsedMs(startedAt),
    tests: tests,
    logs: loadLogs,
  };
}

async function loadPyodideRuntime(indexURL) {
  if (!pyodidePromise) {
    importScripts(indexURL + '/pyodide.js');
    pyodidePromise = self.loadPyodide({ indexURL: indexURL });
  }

  return pyodidePromise;
}

function pyValueToJs(value) {
  if (value && typeof value.toJs === 'function') {
    return value.toJs({ dict_converter: Object.fromEntries });
  }

  return value;
}

function destroyPyProxy(value) {
  if (value && typeof value.destroy === 'function') {
    value.destroy();
  }
}

function appendLog(method, values) {
  if (pendingLogs.length >= 100) {
    return;
  }

  pendingLogs.push({
    method: method,
    values: values.map(formatValue),
  });
}

function consumeLogs() {
  const logs = pendingLogs;
  pendingLogs = [];
  return logs;
}

function deepEqual(left, right) {
  if (Object.is(left, right)) {
    return true;
  }

  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') {
    return false;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every(function (value, index) {
        return deepEqual(value, right[index]);
      });
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  return leftKeys.length === rightKeys.length &&
    leftKeys.every(function (key) {
      return Object.prototype.hasOwnProperty.call(right, key) &&
        deepEqual(left[key], right[key]);
    });
}

function getStatusFromTestResults(results) {
  if (results.some(function (result) { return result.status === 'timeout'; })) {
    return 'timeout';
  }

  if (results.some(function (result) { return result.status === 'error'; })) {
    return 'error';
  }

  if (results.every(function (result) { return result.status === 'passed'; })) {
    return 'passed';
  }

  return 'failed';
}

function formatValue(value) {
  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (typeof value === 'undefined') {
    return 'undefined';
  }

  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }

  if (typeof value === 'function') {
    return '[Function ' + (value.name || 'anonymous') + ']';
  }

  try {
    const seen = new WeakSet();
    const serialized = JSON.stringify(value, function (_key, nestedValue) {
      if (typeof nestedValue === 'bigint') {
        return nestedValue.toString() + 'n';
      }

      if (typeof nestedValue === 'function') {
        return '[Function ' + (nestedValue.name || 'anonymous') + ']';
      }

      if (typeof nestedValue === 'object' && nestedValue !== null) {
        if (seen.has(nestedValue)) {
          return '[Circular]';
        }

        seen.add(nestedValue);
      }

      return nestedValue;
    }, 2);

    return serialized == null ? String(value) : serialized;
  } catch (_error) {
    return String(value);
  }
}

function errorToMessage(error) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return formatValue(error);
}

function getNow() {
  return self.performance && self.performance.now ? self.performance.now() : Date.now();
}

function getElapsedMs(startedAt) {
  return Math.max(0, Math.round(getNow() - startedAt));
}
`
