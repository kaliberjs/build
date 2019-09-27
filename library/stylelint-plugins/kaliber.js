const stylelint = require('stylelint')

const ruleName = 'kaliber/stylelint'
const messages =  stylelint.utils.ruleMessages(ruleName, {
  'root - z-index without position relative': 'missing position: relative;\n\n`z-index` can only be used at the root level when creating a non invasive stacking context - add `position: relative;` or set `z-index` from parent',
  'root - z-index not 0': 'not 0\n\n`z-index` can only be used at the root level when creating a non invasive stacking context - set to 0 or set `z-index` from parent',
  'nested - missing stacking context in parent': 'missing stacking context (position: relative; z-index: 0;)\n\n`z-index` can only be used when the parent creates a new stacking context - add `position: relative;` and `z-index: 0` to parent',
  // doubleNesting: 'nesting too deep',
  // onlyTopLevel: prop => `'${prop}' should only appear in top level rules`,
  // invalidZIndexContext: 'can only use z-index if parent creates a neutral stacking context',
  // invalidZIndexAtRoot: 'z-index on root level can only be used to create a stacking context, set value from parent or set it to 0',
  // invalidPositionAbsoluteValueAtRoot: 'position can not be absolute at root, set from parent',
  // onlyZIndexForStackingContextAtRoot: 'z-index is only valid if you use it to create a stacking context (add position: relative)'
})

module.exports = stylelint.createPlugin(ruleName, (primaryOption, secondaryOptionObject) => {
  return function(root, result) {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, { actual: primaryOption, possible: [true] })
    if (!validOptions) { return }

    root.walkRules(rule => {
      // console.log(rule.selector)
      const parent = getParentRule(rule)

      if (parent) {
        // if (getParent(parent)) report(rule, messages.doubleNesting)
        const parentDecls = getDecls(parent)

        rule.each(x => {
          if (x.type === 'decl') {
            // if (x.prop === 'padding') report(x, messages.onlyTopLevel('padding'))
            if (x.prop === 'z-index' && (parentDecls['z-index'] !== '0' || parentDecls['position'] !== 'relative')) report(x, messages['nested - missing stacking context in parent'])
          }
        })
      } else {
        const decls = getDecls(rule)
        rule.each(x => {
          if (x.type === 'decl') {
            if (x.prop === 'z-index') {
              if (decls['position'] !== 'relative') report(x, messages['root - z-index without position relative'])
              if (x.value !== '0') report(x, messages['root - z-index not 0'])
            }
            // if (x.prop === 'position' && x.value === 'absolute') report(x, messages.invalidPositionAbsoluteValueAtRoot)
          }
        })
      }
    })

    function report(node, message) {
      stylelint.utils.report({ message, node, result, ruleName })
    }

  }
})

module.exports.ruleName = ruleName
module.exports.messages = messages

function getParentRule({ parent }) {
  return parent.type !== 'root' &&
        (parent.type === 'rule' ? parent : getParentRule(parent))
}

function getDecls(node) {
  const result = {}
  node.each(x => {
    if (x.type === 'decl') result[x.prop] = x.value
  })
  return result
}
