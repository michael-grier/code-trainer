const exampleMarker = 'Example:'

export type ProblemPromptParts = {
  instructions: string
  example?: string
}

export function splitProblemPrompt(prompt: string): ProblemPromptParts {
  const markerIndex = prompt.indexOf(exampleMarker)

  if (markerIndex === -1) {
    return { instructions: prompt.trim() }
  }

  const instructions = prompt.slice(0, markerIndex).trim()
  const example = prompt.slice(markerIndex + exampleMarker.length).trim()

  return {
    instructions,
    example: example || undefined,
  }
}
