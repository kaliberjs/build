const { parseSelector } = require('../../machinery/ast')
const { isFile } = require('../../machinery/filename')

const messages = {
  'no class selectors': selector =>
      `Unexpected class selector '${selector}', only tag selectors are allowed in index.css - ` +
      `move the selector to another file or wrap it in \`:global(...)\``,
  'only import font':
    `Invalid @import value\n` +
    `you can only import fonts`,
}

module.exports = {
  ruleName: 'index',
  ruleInteraction: {
    'selector-policy': {
      allowTagSelectors: isIndex,
    },
    'no-import': {
      allowSpecificImport: rule => isIndex(rule.root()) && (
        rule.params.includes('font') ||
        messages['only import font']
      )
    },
  },
  cssRequirements: {
    // resolvedCustomSelectors: true, TODO: add test case
  },
  messages,
  create(config) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      onlyTagSelectorsInIndex({ root: modifiedRoot, report })
    }
  }
}

function onlyTagSelectorsInIndex({ root, report }) {
  if (!isIndex(root)) return
  root.walkRules(rule => {
    const root = parseSelector(rule)
    const [classNode] = root.first.filter(x => x.type === 'class')
    if (!classNode) return
    report(rule, messages['no class selectors'](classNode.value), classNode.sourceIndex + 1)
  })
}

function isIndex(root) { return isFile(root, 'index.css') }
