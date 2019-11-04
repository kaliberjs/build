const {
  withRootRules,
  isRoot,
  getRootRules,
} = require('../../machinery/ast')
const { checkRuleRelation } = require('../../machinery/relations')

const messages = {
  'root - z-index without position relative':
    'missing `position: relative;`\n' +
    '`z-index` can only be used at the root level to create a non invasive stacking context - ' +
    'add `position: relative;` or set the `z-index` with a nested selector in another root rule',
  'root - z-index not 0':
    'not 0\n' +
    '`z-index` can only be used at the root level when creating a non invasive stacking context - ' +
    'set to 0 or set the `z-index` with a nested selector in another root rule',
}

const rootCombos = {
  validStackingContext: {
    rootHasOneOf: ['z-index'],
    require: [
      ['z-index', '0'],
      ['position', 'relative']
    ]
  },
}

module.exports = {
  ruleName: 'root-policy',
  ruleInteraction: null,
  cssRequirements: {
    normalizedMediaQueries: true,
    // resolvedCustomProperties: true, TODO: add test case
    // resolvedCustomMedia: true, TODO: add test case (probably only possible when we have added correct resolution for)
    // resolvedCustomSelectors: true, TODO: add test case
    // resolvedModuleValues: true, TODO: add test case
  },
  messages,
  create(config) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      validStackingContextInRoot({ root: modifiedRoot, report })
    }
  }
}

function validStackingContextInRoot({ root, report }) {
  withRootRules(root, rule => {

    const result = checkRootCombo(rule, rootCombos.validStackingContext)

    result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
      if (prop === 'position') report(triggerDecl, messages['root - z-index without position relative'])
      if (prop === 'z-index') report(triggerDecl, messages['root - z-index not 0'])
    })
  })
}

function checkRootCombo(rootRule, { rootHasOneOf, require }) {
  if (!isRoot(rootRule)) throw new Error('You should not call this function with a non-root rule')

  return checkRuleRelation({
    rule: rootRule,
    triggerProperties: rootHasOneOf,
    rulesToCheck: getRootRules(rootRule),
    requiredProperties: require
  })
}
