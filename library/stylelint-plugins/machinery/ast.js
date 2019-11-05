const createValueParser = require('postcss-values-parser')
const createSelectorParser = require('postcss-selector-parser')

const selectorParser = createSelectorParser()

module.exports = {
  declMatches, findDecls,
  parseValue, parseSelector,
  withRootRules, withNestedRules,
  isPseudoElement, isRoot, hasChildSelector,
  getParentRule, getChildSelectors, getRootRules,
  splitByMediaQueries,
}

function withRootRules(root, f) {
  root.walkRules(rule => {
    if (!isRoot(rule)) return
    f(rule)
  })
}

function withNestedRules(root, f) {
  root.walkRules(rule => {
    if (isRoot(rule)) return
    f(rule, getParentRule(rule))
  })
}

function isRoot(rule) {
  const parent = getParentRule(rule)
  return !parent || (isRoot(parent) && !hasChildSelector(rule))
}

function getParentRule({ parent }) {
  return parent.type !== 'root' &&
        (parent.type === 'rule' ? parent : getParentRule(parent))
}

function getRootRules(node) {
  if (!node) return []
  const parent = getParentRule(node)
  if (isRoot(node)) return getRootRules(parent).concat(node)
  return getRootRules(parent)
}

function hasChildSelector(rule) {
  return !!getChildSelectors(rule).length
}

function getChildSelectors(rule) {
  const root = selectorParser.astSync(rule)
  return root.first.filter(x => x.type === 'combinator' || isPseudoElement(x))
}

function isPseudoElement({ type, value }) {
  return type === 'pseudo' && value.startsWith('::')
}

function parseValue(value) { return createValueParser(value).parse() }

function parseSelector(rule) { return selectorParser.astSync(rule) }

function findDecls(rule, targets, { onlyInvalidTargets = false } = {}) {
  let result = []
  const normalizedTargets = normalize(targets)

  rule.each(node => {
    if (
      node.type !== 'decl' ||
      (onlyInvalidTargets && !invalidTarget(normalizedTargets, node)) ||
      (!onlyInvalidTargets && invalidTarget(normalizedTargets, node))
    ) return

    result.push(node)
    const continueIteration = onlyInvalidTargets || result.length !== targets.length
    return continueIteration
  })

  return result
}

function declMatches(decl, targets) {
  const normalizedTargets = normalize(targets)
  return !invalidTarget(normalizedTargets, decl)
}

function normalize(targets) {
  return targets.reduce(
    (result, x) => {
      const [name, value] = Array.isArray(x) ? x : [x, []]
      const values = result[name] || []
      return { ...result, [name]: values.concat(value) }
    },
    {}
  )
}

function invalidTarget(targets, { prop, value }) {
  const hasProp = targets.hasOwnProperty(prop)
  const targetValue = targets[prop]
  return !hasProp || (!!targetValue.length && !targetValue.includes(value))
}

function splitByMediaQueries(root) {
  const mediaQueries = gatherMediaQueries(root)

  const clone = root.clone()
  clone.walkAtRules('media', x => { x.remove() })

  const byMediaQueries = mediaQueries.reduce(
    (result, params) => {
      const clone = root.clone()

      extractAndRemoveMediaRules(clone, params)
        .forEach(({ parent, rule }) => { merge(rule, parent) })

      return { ...result, [params]: clone }
    },
    { '': clone }
  )

  return byMediaQueries

  function gatherMediaQueries(root) {
    const mediaQueries = {}
    root.walkAtRules('media', ({ params }) => { mediaQueries[params] = true })
    return Object.keys(mediaQueries)
  }

  function extractAndRemoveMediaRules(container, params) {
    const atRules = []
    container.walkAtRules('media', rule => {
      const { parent } = rule
      rule.remove()
      if (rule.params === params) atRules.push({ parent, rule })
    })
    return atRules
  }

  function merge(source, target) {
    const ruleLookup = {}
    const declLookup = {}
    target.each(x => {
      if (x.type === 'rule') ruleLookup[x.selector] = x
      if (x.type === 'decl') declLookup[x.prop] = x
    })

    source.each(x => {
      if (x.type === 'decl') {
        const existing = declLookup[x.prop]
        if (existing) existing.replaceWith(x)
        else target.append(x)
      }

      if (x.type === 'rule') {
        const existing = ruleLookup[x.selector]
        if (existing) merge(x, existing)
        else target.append(x)
      }

      if (x.type === 'atrule') target.append(x)
    })
  }
}
