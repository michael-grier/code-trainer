import { MAX_RUNNER_TEXT_LENGTH } from './types'

const TRUNCATION_MARKER = '…'

// Bounds learner-controlled display text to the sandbox response contract.
export function clampRunnerText(value: string) {
  if (value.length <= MAX_RUNNER_TEXT_LENGTH) {
    return value
  }

  return `${value.slice(0, MAX_RUNNER_TEXT_LENGTH - TRUNCATION_MARKER.length)}${TRUNCATION_MARKER}`
}
