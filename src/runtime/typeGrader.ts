import ts from 'typescript'

// The exact configuration every type-checked problem is graded under.
// Section 12.6 of the build plan requires this to be fixed and documented:
// changing any option here changes what counts as a passing submission, so
// treat edits as curriculum changes, not tuning.
export const TYPE_GRADER_COMPILER_OPTIONS: ts.CompilerOptions = {
  strict: true,
  target: ts.ScriptTarget.ES2022,
  lib: ['lib.es2022.d.ts'],
  module: ts.ModuleKind.ESNext,
  noEmit: true,
  // Lib files ship pre-checked with the compiler; re-checking them adds
  // seconds of work and can only surface upstream issues, never learner ones.
  skipLibCheck: true,
}

export const TYPE_GRADER_COMPILER_VERSION = ts.version

export const SUBMISSION_FILE_NAME = 'submission.ts'

export type TypeCheckSource = 'solution' | 'type-tests'

export type TypeCheckDiagnostic = {
  // 1-indexed position within the region named by `source`.
  line: number
  column: number
  message: string
  code: number
  source: TypeCheckSource
}

export type TypeCheckResult = {
  passed: boolean
  diagnostics: TypeCheckDiagnostic[]
  compilerVersion: string
}

export type TypeCheckInput = {
  code: string
  // Hidden fixture appended below the learner's code in the same module, so
  // it can reference the learner's exported and top-level declarations
  // directly. It carries type-level assertions and @ts-expect-error markers;
  // an unsatisfied marker fails via the compiler's own TS2578 diagnostic.
  typeFixture?: string
}

// Every lib file the fixed configuration can pull in, keyed by file name
// (for example "lib.es2022.d.ts"). The worker bundles these; Node tests read
// them from the typescript package directory.
export type LibFileMap = Record<string, string>

export function runTypeCheck(
  input: TypeCheckInput,
  libFiles: LibFileMap,
): TypeCheckResult {
  const solutionLineCount = countLines(input.code)
  const combinedSource = input.typeFixture
    ? `${input.code}\n${input.typeFixture}`
    : input.code

  const sourceFiles = new Map<string, ts.SourceFile>()
  sourceFiles.set(
    SUBMISSION_FILE_NAME,
    ts.createSourceFile(
      SUBMISSION_FILE_NAME,
      combinedSource,
      TYPE_GRADER_COMPILER_OPTIONS.target ?? ts.ScriptTarget.ES2022,
      true,
    ),
  )

  for (const [fileName, source] of Object.entries(libFiles)) {
    sourceFiles.set(
      fileName,
      ts.createSourceFile(fileName, source, ts.ScriptTarget.ES2022, true),
    )
  }

  const host = createVirtualHost(sourceFiles)
  const program = ts.createProgram(
    [SUBMISSION_FILE_NAME],
    TYPE_GRADER_COMPILER_OPTIONS,
    host,
  )

  const rawDiagnostics = [
    ...program.getSyntacticDiagnostics(),
    ...program.getSemanticDiagnostics(),
    ...program.getOptionsDiagnostics(),
  ]

  const diagnostics = rawDiagnostics.map((diagnostic) =>
    toTypeCheckDiagnostic(diagnostic, solutionLineCount),
  )

  return {
    passed: diagnostics.length === 0,
    diagnostics,
    compilerVersion: TYPE_GRADER_COMPILER_VERSION,
  }
}

function createVirtualHost(
  sourceFiles: Map<string, ts.SourceFile>,
): ts.CompilerHost {
  return {
    getSourceFile: (fileName) => sourceFiles.get(fileName),
    getDefaultLibFileName: () => 'lib.es2022.d.ts',
    writeFile: () => undefined,
    getCurrentDirectory: () => '/',
    getCanonicalFileName: (fileName) => fileName,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
    fileExists: (fileName) => sourceFiles.has(fileName),
    readFile: (fileName) => sourceFiles.get(fileName)?.text,
  }
}

function toTypeCheckDiagnostic(
  diagnostic: ts.Diagnostic,
  solutionLineCount: number,
): TypeCheckDiagnostic {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')

  if (
    !diagnostic.file ||
    diagnostic.file.fileName !== SUBMISSION_FILE_NAME ||
    diagnostic.start === undefined
  ) {
    return {
      line: 1,
      column: 1,
      message,
      code: diagnostic.code,
      source: 'solution',
    }
  }

  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
  const combinedLine = position.line + 1

  // Diagnostics past the learner's last line belong to the hidden fixture.
  // Report them against the fixture's own line numbering so the message
  // matches nothing the learner can see being miscounted.
  if (combinedLine > solutionLineCount) {
    return {
      line: combinedLine - solutionLineCount,
      column: position.character + 1,
      message,
      code: diagnostic.code,
      source: 'type-tests',
    }
  }

  return {
    line: combinedLine,
    column: position.character + 1,
    message,
    code: diagnostic.code,
    source: 'solution',
  }
}

function countLines(text: string) {
  return text.split('\n').length
}
