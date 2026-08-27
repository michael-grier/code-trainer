export {
  getProblemStarterCode,
  runCode,
} from './codeRunner'
export { deepEqual } from './deepEqual'
export {
  allStaticChecksPassed,
  runStaticChecks,
} from './staticChecks'
export {
  gradeTraceProblem,
  gradeTraceQuestion,
} from './traceGrader'
export {
  DEFAULT_RUN_TIMEOUT_MS,
} from './types'
export type {
  CodeRunInput,
  CodeRunResult,
  CodeRunStatus,
  ConsoleMessage,
  ConsoleMethod,
  TestRunResult,
  TestRunStatus,
} from './types'
export type { StaticCheckResult } from './staticChecks'
export type { TraceGradeResult, TraceGradeSummary } from './traceGrader'
// Only the worker-backed entry points and types are exported here. Value
// exports from typeGrader would pull the whole typescript package into the
// main bundle, and the React harness (with react-dom and linkedom) must
// likewise stay inside its lazily created worker chunk.
export { runTypeCheckInWorker } from './typeRunner'
export type {
  TypeCheckDiagnostic,
  TypeCheckResult,
  TypeCheckSource,
} from './typeGrader'
export { runReactTests } from './reactRunner'
export type { ReactRunInput } from './reactWorker'
