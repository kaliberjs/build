const createValueParser = require('postcss-values-parser')
const createSelectorParser = require('postcss-selector-parser')

const selectorParser = createSelectorParser()

module.exports = {
  declMatches, findDecls,
  parseValue, parseSelector,
  withRootRules, withNestedRules,
  isPseudoElement, isRoot, hasChildSelector,
  getParentRule, getChildSelectors, getRootRules,
  getNormalizedRoots,
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
  const selectors = selectorParser.astSync(rule)
  const childSelectors = []
  selectors.each(selector => {
    selector.each(x => {
      if (x.type === 'combinator' || isPseudoElement(x)) childSelectors.push(x)
    })
  })
  return childSelectors
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

/*
  We create new root nodes for each applicable media query.

  This is not a complete solution. Multiple media queries apply, and we now only check for
  'same param queries'. This means that we might falsly report or miss some errors. We can
  only make a full solution if we have a string params policy that allows us to sort and apply
  the correct queries. An example (assuming that when y applies, x applies as well):

    .test {
      @media x {
        position: relative;
      }
      @media y {
        z-index: 0;

        & > * {
          position: absolute;
          z-index: 1;
        }
      }
    }
*/
function getNormalizedRoots(root) {
  const combinations = gatherPossibleCombinations(root)

  const clone = root.clone()
  clone.walkAtRules('media', x => { x.remove() })

  const byMediaQueries = combinations.reduce(
    (result, atRules) => {
      const clone = root.clone()

      extractAndRemoveAtRules(clone, atRules)
        .forEach(({ parent, rule }) => { merge(rule, parent) })

      return [ ...result, clone ]
    },
    [clone]
  )

  return byMediaQueries

  function gatherPossibleCombinations(root) {
    const mediaQueriesSet = new Set()
    const supportsSet = new Set()
    root.walkAtRules('media', x => { mediaQueriesSet.add(x.params) })
    root.walkAtRules('supports', x => { supportsSet.add(x.params) })

    const supports = Array.from(supportsSet).map(params => ({ type: 'supports', params }))
    const supportsCombinations = getAllPossibleCombinations(supports)
    const combinations = Array.from(mediaQueriesSet).reduce(
      (result, params) => {
        const media = { type: 'media', params }

        return result.concat(supportsCombinations.map(x => [...x, media]))
      },
      supportsCombinations
    )
    return combinations
  }

  function getAllPossibleCombinations(options) {
    return options.reduce(
      (result, option) => result.concat(result.map(previous => [...previous, option])),
      [[]]
    )
  }

  function extractAndRemoveAtRules(container, atRules) {
    const extracted = []
    atRules.forEach(({ type, params }) => {
      container.walkAtRules(type, rule => {
        const { parent } = rule
        rule.remove()
        if (rule.params === params) extracted.push({ parent, rule })
      })
    })
    return extracted
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
