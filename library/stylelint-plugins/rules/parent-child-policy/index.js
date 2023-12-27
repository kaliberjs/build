const {
  findDecls,
  parseSelector,
  withRootRules,
  withNestedRules,
  isRoot, declMatches,
  getRootRules,
} = require('../../machinery/ast')
const { checkRuleRelation } = require('../../machinery/relations')
const { flexChildProps, gridChildProps, flexOrGridChildProps } = require('../../machinery/css')

const messages = {
  'nested - missing stacking context in parent':
    'missing stacking context (`position: relative; z-index: 0;`)\n' +
    '`z-index` can only be used when the containing root rule creates a new stacking context - ' +
    'add `position: relative;` and `z-index: 0` to the containing root rule',
  'nested - absolute has relative parent':
    'missing `position: relative;` in parent\n' +
    '`position: absolute` is only allowed when the containing root rule is set to `position: relative` -' +
    'add `position: relative;` to the containing root rule',
  'nested - require display flex in parent': prop =>
    `missing \`display: flex;\`\n` +
    `\`${prop}\` can only be used when the containing root rule has \`display: flex;\` - ` +
    `add \`display: flex;\` to the containing root rule or, if this is caused by a media query ` +
    `that overrides \`display: flex;\`, use \`${prop}: unset\``,
  'nested - require display grid in parent': prop =>
    `missing \`display: grid;\`\n` +
    `\`${prop}\` can only be used when the containing root rule has \`display: grid;\` - ` +
    `add \`display: grid;\` to the containing root rule or, if this is caused by a media query ` +
    `that overrides \`display: grid;\`, use \`${prop}: unset\``,
  'nested - require display flex or grid in parent': prop =>
    `missing \`display: flex;\` or \`display: grid;\`\n` +
    `\`${prop}\` can only be used when the containing root rule has \`display: flex;\` or \`display: grid;\` - ` +
    `add \`display: flex;\` or \`display: grid;\` to the containing root rule or, if this is caused by a media query ` +
    `that overrides \`display: flex;\` or \`display: grid;\`, use \`${prop}: unset\``,
  'layoutClassname - must be nested in a parent selector':
    `layoutClassNames (classes ending with the \`Layout\` suffix) can only be targetted by a parent selector, using the direct child selector. ` +
    `Consequentially, you can only use layout related properties in layoutClassNames.`,
  'invalid pointer events':
    `Incorrect pointer events combination\n` +
    `you can only set pointer events in a child if the parent disables pointer events - ` +
    `add pointer-events: none to parent`,
  'missing position relative':
    'Missing `position: relative;` in parent\n' +
    '`position: static` is only allowed when the containing root rule is set to `position: relative` - ' +
    'add `position-relative` to the containing root rule',
}

// TODO: move errors into the different relations (would allows us to simplify the actual checks)
const childParentRelations = {
  validStackingContextInRoot: {
    nestedHasOneOf: ['z-index'],
    requireInRoot: [
      ['z-index', '0'],
      ['position', 'relative']
    ],
  },
  absoluteHasRelativeParent: {
    nestedHasOneOf: [
      ['position', 'absolute']
    ],
    requireInRoot: [
      ['position', 'relative']
    ]
  },
  rootHasDisplayFlex: {
    nestedHasOneOf: flexChildProps,
    requireInRoot: [
      ['display', 'flex']
    ]
  },
  rootHasDisplayGrid: {
    nestedHasOneOf: gridChildProps,
    requireInRoot: [
      ['display', ['grid', 'inline-grid']]
    ]
  },
  rootHasDisplayFlexOrGrid: {
    nestedHasOneOf: flexOrGridChildProps,
    requireInRoot: [
      ['display', ['flex', 'grid', 'inline-grid']]
    ]
  },
  validPointerEvents: {
    nestedHasOneOf: [
      ['pointer-events', 'auto']
    ],
    requireInRoot: [
      ['pointer-events', 'none']
    ]
  },
  relativeToParent: {
    nestedHasOneOf: [
      ['position', 'static'],
    ],
    requireInRoot: [
      ['position', 'relative']
    ],
  },
}

module.exports = {
  ruleName: 'parent-child-policy',
  ruleInteraction: {
    'layout-related-properties': {
      childAllowDecl: decl => declMatches(decl, [['pointer-events', 'auto'], ['position', 'static']])
    },
  },
  cssRequirements: {
    normalizedCss: true,
    // resolvedCustomProperties: true, TODO: add test case
    // resolvedCustomMedia: true, TODO: add test case (probably only possible when we have added correct resolution for)
    // resolvedCustomSelectors: true, TODO: add test case
    // resolvedModuleValues: true, TODO: add test case
  },
  messages,
  create(config) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      requireStackingContextInParent({ root: modifiedRoot, report })
      absoluteHasRelativeParent({ root: modifiedRoot, report })
      requireDisplayFlexInParent({ root: modifiedRoot, report })
      requireDisplayGridInParent({ root: modifiedRoot, report })
      requireDisplayFlexOrGridInParent({ root: modifiedRoot, report })
      validPointerEvents({ root: modifiedRoot, report })
      relativeToParent({ root: modifiedRoot, report })
      requireLayoutClassNameToBeDirectChild({ root: modifiedRoot, report })
    }
  }
}

function requireStackingContextInParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.validStackingContextInRoot)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['nested - missing stacking context in parent'])
    })
  })
}

function absoluteHasRelativeParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.absoluteHasRelativeParent)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['nested - absolute has relative parent'])
    })
  })
}

function requireDisplayFlexInParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.rootHasDisplayFlex)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['nested - require display flex in parent'](triggerDecl.prop))
    })
  })
}

function requireDisplayGridInParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.rootHasDisplayGrid)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['nested - require display grid in parent'](triggerDecl.prop))
    })
  })
}

function requireDisplayFlexOrGridInParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.rootHasDisplayFlexOrGrid)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['nested - require display flex or grid in parent'](triggerDecl.prop))
    })
  })
}

function validPointerEvents({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.validPointerEvents)
    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['invalid pointer events'])
    })
  })
}

function relativeToParent({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    const result = checkChildParentRelation(rule, childParentRelations.relativeToParent)
    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      report(triggerDecl, messages['missing position relative'])
    })
  })
}

function requireLayoutClassNameToBeDirectChild({ root, report }) {
  withRootRules(root, rule => {
    if (!rule.selector.includes('Layout')) return
    parseSelector(rule).nodes.forEach(node => {
      const className = node.nodes.find(x => x.type === 'class')
      if (className && className.toString().endsWith('Layout')) {
        report(rule, messages['layoutClassname - must be nested in a parent selector'])
      }
    })
  })
}

function checkChildParentRelation(childRule, { nestedHasOneOf, requireInRoot }) {
  if (isRoot(childRule)) throw new Error('You should not call this function with a root rule')

  return checkRuleRelation({
    rule: childRule,
    triggerProperties: nestedHasOneOf,
    rulesToCheck: getRootRules(childRule),
    requiredProperties: requireInRoot,
  })
}
