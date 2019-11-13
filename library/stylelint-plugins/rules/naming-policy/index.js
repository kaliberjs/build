const {
  parseSelector,
  withNestedRules,
  getRootRules,
} = require('../../machinery/ast')

const pseudoStates = [
  ':hover', ':active', ':focus',
  ':enabled', ':disabled', ':checked',
  ':empty', ':valid', ':invalid', ':in-range', ':out-of-range',
]

const messages = {
  'nested - no component class name in nested': className =>
    `illegal class name\n` +
    `\`${className}\` can not be used in nested selectors - ` +
    `remove \`component\` from the name`,
  'value should start with underscore':
    `Expected underscore \`_\`\n` +
    `to prevent conflicts all values should start with an underscore - ` +
    `prefix the value with an underscore or, if you want to export a value, use \`:export { ... }\``,
  'property lower case': (actual, expected) =>
    `Expected '${actual}' to be '${expected}'`,
  'export collision':
    `Detected export collision\n` +
    `a class is exported with this exact name - ` +
    `rename the export`,
  'no _root child selectors':
    `Unexpected _root selector\n` +
    `_root or component_root selectors can not be used as a child selector - ` +
    `remove the _root or component_root prefix`,
}

module.exports = {
  ruleName: 'naming-policy',
  ruleInteraction: {
    'layout-related-properties': {
      rootAllowRule: is_root,
      childAllowRule: rule =>
        hasStateSelectorInParent(rule) &&
        rootNameIsNotComponent(rule) &&
        selectorNameHasRootNameAsPrefix(rule)
      },
      'selector-policy': {
        doubleSelectorsAllowRule: rule =>
          hasStateSelectorInParent(rule) &&
          rootNameIsNotComponent(rule) &&
          selectorNameHasRootNameAsPrefix(rule)
    },
  },
  cssRequirements: {
    resolvedCustomSelectors: true,
  },
  messages,
  create(config) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      noComponentNameInNested({ modifiedRoot, report })
      valueStartsWithUnderscore({ originalRoot, report })
      propertyLowerCase({ originalRoot, report, context })
      preventExportCollisions({ originalRoot, report })
      noRootInChildSelector({ modifiedRoot, report })
    }
  }
}

function noComponentNameInNested({ modifiedRoot, report }) {
  withNestedRules(modifiedRoot, (rule, parent) => {
    parseSelector(rule).walkClasses(x => {
      const className = x.value
      if (className.startsWith('component'))
        report(rule, messages['nested - no component class name in nested'](className), x.sourceIndex)
    })
  })
}

function valueStartsWithUnderscore({ originalRoot, report }) {
  originalRoot.walkAtRules('value', rule => {
    if (rule.params.startsWith('_')) return

    report(rule, messages['value should start with underscore'], 8)
  })
}

function propertyLowerCase({ originalRoot, report, context }) {
  originalRoot.walkDecls(decl => {
    const { prop, parent } = decl

    if (prop.startsWith('--')) return

    const expectedProp = prop.toLowerCase()

    if (prop === expectedProp) return
    if (parent.type === 'rule' && parent.selector === ':export') return
    if (context.fix) {
      decl.prop = expectedProp
      return
    }

    report(decl, messages['property lower case'](prop, expectedProp))
  })
}

function preventExportCollisions({ originalRoot, report }) {
  const classes = []
  originalRoot.walkRules(rule => {
    parseSelector(rule).walkClasses(x => { classes.push(x.value) })
  })
  originalRoot.walkRules(':export', rule => {
    rule.each(node => {
      if (node.type !== 'decl') return
      if (!classes.includes(node.prop)) return
      report(node, messages['export collision'])
    })
  })
}

function noRootInChildSelector({ modifiedRoot, report }) {
  withNestedRules(modifiedRoot, (rule, parent) => {
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      const [first, second] = selector.filter(x =>
        (x.type === 'combinator' && x.value === ' ') ||
        (x.type === 'class' && (x.value.startsWith('_root') || x.value.startsWith('component_root')))
      )
      const rootSelector =
        first && first.type === 'class' ? first :
        second && second.type === 'class' ? second :
        null

      if (!rootSelector) return
      if (first.type === 'combinator') return

      report(rule, messages['no _root child selectors'], rootSelector.sourceIndex)
    })
  })
}

function is_root(rule) {
  return rule.selector.startsWith('._root') || rule.selector.startsWith('.component_root')
}

function hasStateSelectorInParent(rule) {
  const rootRules = getRootRules(rule)
  return rootRules.reverse().some(hasStateSelector)
}

function rootNameIsNotComponent(rule) {
  const rootName = getRootName(rule)
  return rootName && !rootName.startsWith('component')
}

function selectorNameHasRootNameAsPrefix(rule) {
  const rootName = getRootName(rule)
  if (!rootName) return
  return parseSelector(rule).every(selector => {
    const { type, value } = selector.last
    return type === 'class' && value.startsWith(rootName)
  })
}

function getRootName(rule) {
  const [rootRule] = getRootRules(rule)
  const rootName = parseSelector(rootRule).reduce(
    (result, selector) => {
      const { type, value } = selector.first
      const className = type === 'class' && value
      return result === null
        ? value
        : className === result && result
    },
    null
  )
  return rootName
}

function hasStateSelector(rule) {
  const selectors = parseSelector(rule)
  return selectors.every(isStateSelector)
}

function isStateSelector(selector) {
  const [first, second] = selector.nodes
  return first.type === 'nesting' && second && (
    isClassState(second) ||
    isPseudoClassState(second) ||
    isAttributeState(second)
  )
}

function isClassState({ type, value }) {
  return type === 'class' && /(^is-[a-z]|is[A-Z])/.test(value)
}

function isPseudoClassState(node) {
  const { type, value } = node
  return type === 'pseudo' && pseudoStates.includes(value)
}

function isAttributeState({ type }) {
  return type === 'attribute'
}
