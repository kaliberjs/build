const {
  parseSelector,
  withNestedRules,
} = require('../../machinery/ast')

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
      rootAllowRule: isRoot,
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

function isRoot(rule) {
  return rule.selector.startsWith('._root') || rule.selector.startsWith('.component_root')
}
