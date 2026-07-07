export function deepEqual(left: unknown, right: unknown): boolean {
  return deepEqualValue(left, right, new WeakMap())
}

type SeenPairs = WeakMap<object, WeakSet<object>>

function deepEqualValue(
  left: unknown,
  right: unknown,
  seen: SeenPairs,
): boolean {
  if (Object.is(left, right)) {
    return true
  }

  if (!isObject(left) || !isObject(right)) {
    return false
  }

  if (hasSeenPair(left, right, seen)) {
    return true
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return arraysEqual(left, right, seen)
  }

  if (left instanceof Date || right instanceof Date) {
    return (
      left instanceof Date &&
      right instanceof Date &&
      Object.is(left.getTime(), right.getTime())
    )
  }

  if (left instanceof RegExp || right instanceof RegExp) {
    return (
      left instanceof RegExp &&
      right instanceof RegExp &&
      left.source === right.source &&
      left.flags === right.flags
    )
  }

  if (left instanceof Map || right instanceof Map) {
    return mapsEqual(left, right, seen)
  }

  if (left instanceof Set || right instanceof Set) {
    return setsEqual(left, right, seen)
  }

  if (Object.getPrototypeOf(left) !== Object.getPrototypeOf(right)) {
    return false
  }

  return objectsEqual(left, right, seen)
}

function hasSeenPair(left: object, right: object, seen: SeenPairs) {
  const matches = seen.get(left)

  if (matches?.has(right)) {
    return true
  }

  if (matches) {
    matches.add(right)
  } else {
    seen.set(left, new WeakSet([right]))
  }

  return false
}

function arraysEqual(
  left: object,
  right: object,
  seen: SeenPairs,
): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) {
    return false
  }

  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => deepEqualValue(value, right[index], seen))
}

function mapsEqual(left: object, right: object, seen: SeenPairs): boolean {
  if (!(left instanceof Map) || !(right instanceof Map)) {
    return false
  }

  if (left.size !== right.size) {
    return false
  }

  const unmatchedEntries = [...right.entries()]

  for (const [leftKey, leftValue] of left.entries()) {
    const matchIndex = unmatchedEntries.findIndex(
      ([rightKey, rightValue]) =>
        deepEqualValue(leftKey, rightKey, seen) &&
        deepEqualValue(leftValue, rightValue, seen),
    )

    if (matchIndex === -1) {
      return false
    }

    unmatchedEntries.splice(matchIndex, 1)
  }

  return true
}

function setsEqual(left: object, right: object, seen: SeenPairs): boolean {
  if (!(left instanceof Set) || !(right instanceof Set)) {
    return false
  }

  if (left.size !== right.size) {
    return false
  }

  const unmatchedValues = [...right.values()]

  for (const leftValue of left.values()) {
    const matchIndex = unmatchedValues.findIndex((rightValue) =>
      deepEqualValue(leftValue, rightValue, seen),
    )

    if (matchIndex === -1) {
      return false
    }

    unmatchedValues.splice(matchIndex, 1)
  }

  return true
}

function objectsEqual(left: object, right: object, seen: SeenPairs): boolean {
  const leftKeys = Reflect.ownKeys(left)
  const rightKeys = Reflect.ownKeys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  const leftRecord = left as Record<PropertyKey, unknown>
  const rightRecord = right as Record<PropertyKey, unknown>

  return leftKeys.every(
    (key) =>
      rightKeys.includes(key) &&
      deepEqualValue(leftRecord[key], rightRecord[key], seen),
  )
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null
}

