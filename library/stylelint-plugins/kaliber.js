const stylelint = require('stylelint')

const layoutRelatedProps = ['width', 'height', ['position', 'absolute']]
const layoutRelatedPropsWithValues = extractPropsWithValues(layoutRelatedProps)

const rules = /** @type {any[] & { messages: { [key: string]: any } }} */ ([
  requireStackingContextInParent(),
  validStackingContextInRoot(),
  noLayoutRelatedPropsInRoot(),
  noDoubleNesting(),
  absoluteHasRelativeParent(),
  onlyLayoutRelatedPropsInNested(),
])
rules.messages = rules.reduce((result, x) => ({ ...result, ...x.rawMessages }), {})
module.exports = rules

function absoluteHasRelativeParent() {
  const messages = {
    'nested - absolute has relative parent':
      'missing `position: relative;` in parent\n\n' +
      '`position: absolute` is only allowed when the containing root rule is set to `position: relative` -' +
      'add `position: relative;` to the containing root rule'
  }
  return createPlugin({
    ruleName: 'kaliber/absolute-has-relative-parent',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const decl = findDecl(rule, 'position')
        if (!decl || decl.value !== 'absolute') return

        const parentDecl = findDecl(parent, 'position')
        if (!parentDecl || parentDecl.value !== 'relative')
          report(decl, messages['nested - absolute has relative parent'])
      })
    }
  })
}

function noDoubleNesting() {
  const messages = {
    'nested - no double nesting':
      'no double nesting\n\n' +
      'nesting is only allowed one level - ' +
      'create a root rule and move the nested block there'
  }
  return createPlugin({
    ruleName: 'kaliber/no-double-nesting',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        if (getParentRule(parent)) report(rule, messages['nested - no double nesting'])
      })
    }
  })
}

function requireStackingContextInParent() {
  const messages = {
    'nested - missing stacking context in parent':
      'missing stacking context (`position: relative; z-index: 0;`)\n\n' +
      '`z-index` can only be used when the containing root rule creates a new stacking context - ' +
      'add `position: relative;` and `z-index: 0` to the containing root rule',
  }
  return createPlugin({
    ruleName: 'kaliber/require-stacking-context-in-parent',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {

        const decl = findDecl(rule, 'z-index')
        if (!decl) return

        if (missingProps(parent, { 'z-index': '0', 'position': 'relative' }))
        report(decl, messages['nested - missing stacking context in parent'])
      })
    },
  })
}

function validStackingContextInRoot() {
  const messages = {
    'root - z-index without position relative':
      'missing `position: relative;`\n\n' +
      '`z-index` can only be used at the root level to create a non invasive stacking context - ' +
      'add `position: relative;` or set the `z-index` with a nested selector in another root rule',
    'root - z-index not 0':
      'not 0\n\n' +
      '`z-index` can only be used at the root level when creating a non invasive stacking context - ' +
      'set to 0 or set the `z-index` with a nested selector in another root rule',
  }
  return createPlugin({
    ruleName: 'kaliber/valid-stacking-context-in-root',
    messages,
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {

        const decl = findDecl(rule, 'z-index')
        if (!decl) return

        if (missingProps(rule, { 'position': 'relative' }))
          report(decl, messages['root - z-index without position relative'])

        if (decl.value !== '0')
          report(decl, messages['root - z-index not 0'])
      })
    },
  })
}

function noLayoutRelatedPropsInRoot() {
  const messages = {
    'root - no layout related props': prop =>
      `illegal layout related prop\n\n` +
      `\`${prop}\` can only be used by root rules in nested selectors - ` +
      `move to a nested selector in a another root rule`
  }
  return createPlugin({
    ruleName: 'kaliber/no-layout-related-props-in-root',
    messages,
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {

        const decls = findDecls(rule, layoutRelatedProps)
        decls.forEach(decl => {
          const { prop } = decl
          const value = layoutRelatedPropsWithValues[prop]
          report(decl, messages['root - no layout related props'](prop + (value ? `: ${value}` : '')))
        })
      })
    }
  })
}

function onlyLayoutRelatedPropsInNested() {
  const messages = {
    'nested - only layout related props in nested':  prop =>
      `illegal non-layout related prop\n\n` +
      `\`${prop}\` can only be used by root rules - ` +
      `move to another root rule`
  }
  return createPlugin({
    ruleName: 'kaliber/only-layout-related-props-in-nested',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const decls = findDecls(rule, layoutRelatedProps, { onlyInvalidTargets: true })
        decls.forEach(decl => {
          report(decl, messages['nested - only layout related props in nested'](decl.prop))
        })
      })
    }
  })
}

function extractPropsWithValues(props) {
  return props.reduce(
    (result, x) => {
      if (Array.isArray(x)) {
        const [prop, value] = x
        return { ...result, [prop]: value }
      } else return result
    },
    {}
  )
}

function withNestedRules(root, f) {
  root.walkRules(rule => {
    const parent = getParentRule(rule)
    if (!parent) return
    f(rule, parent)
  })
}

function withRootRules(root, f) {
  root.walkRules(rule => {
    const parent = getParentRule(rule)
    if (parent) return
    f(rule)
  })
}

function findDecls(rule, targets, { onlyInvalidTargets = false } = {}) {
  let result = []
  const normalizedTargets = targets.reduce(
    (result, x) => {
      const [name, value] = Array.isArray(x) ? x : [x, '']
      return { ...result, [name]: value }
    },
    {}
  )

  rule.each(node => {
    if (
      node.type !== 'decl' ||
      onlyInvalidTargets && !invalidTarget(normalizedTargets, node) ||
      !onlyInvalidTargets && invalidTarget(normalizedTargets, node)
    ) return

    result.push(node)
    const continueIteration = !onlyInvalidTargets && result.length !== targets.length
    return continueIteration
  })

  return result
}

function invalidTarget(targets, { prop, value }) {
  const hasProp = targets.hasOwnProperty(prop)
  const targetValue = targets[value]
  return !hasProp || (targetValue && targetValue !== value)
}

function findDecl(rule, name) {
  const [result] = findDecls(rule, [name])
  return result
}

function missingProps(target, requiredProps) {
  const actualProps = getProps(target)
  return Object.entries(requiredProps).reduce(
    (invalid, [prop, value]) => invalid || actualProps[prop] !== value,
    false
  )
}

function createPlugin({ ruleName, messages, plugin }) {
  const stylelintPlugin = stylelint.createPlugin(ruleName, pluginWrapper)

  return {
    ...stylelintPlugin,
    rawMessages: messages,
    messages: stylelint.utils.ruleMessages(ruleName, messages),
    ruleName
  }

  function pluginWrapper(primaryOption, secondaryOptionObject) {
    return (root, result) => {
      const check = { actual: primaryOption, possible: [true] }
      if (!stylelint.utils.validateOptions(result, ruleName, check)) return

      plugin({ root, report })

      function report(node, message) { stylelint.utils.report({ message, node, result, ruleName }) }
    }
  }
}

  // onlyTopLevel: prop => `'${prop}' should only appear in top level rules`,
  // invalidPositionAbsoluteValueAtRoot: 'position can not be absolute at root, set from parent',

  // if (getParent(parent)) report(rule, messages.doubleNesting)
  // if (x.prop === 'padding') report(x, messages.onlyTopLevel('padding'))
  // if (x.prop === 'position' && x.value === 'absolute') report(x, messages.invalidPositionAbsoluteValueAtRoot)

function getParentRule({ parent }) {
  return parent.type !== 'root' &&
        (parent.type === 'rule' ? parent : getParentRule(parent))
}

function getProps(node) {
  const result = {}
  node.each(x => {
    if (x.type === 'decl') result[x.prop] = x.value
  })
  return result
}