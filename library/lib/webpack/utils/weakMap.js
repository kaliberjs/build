module.exports = { createScopedWeakMap }

/**
 * @template T
 * @param {{ createInitialValueForScope(): T }} params
 * @returns {(scope: any) => T}
 */
function createScopedWeakMap({ createInitialValueForScope }) {
  const scopedMap = new WeakMap()

  return function getValue(scope) {
    const value = scopedMap.get(scope)
    if (value) return value

    return scopedMap
      .set(scope, createInitialValueForScope())
      .get(scope)
  }
}
