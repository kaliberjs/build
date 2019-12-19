const { parseSelector } = require('../../machinery/ast')
const { isFile } = require('../../machinery/filename')

const messages = {
  'no class selectors': selector =>
    `Unexpected class selector '${selector}', only tag selectors are allowed in index.css - ` +
      `move the selector to another file or wrap it in \`:global(...)\``,
  'only import font':
    `Invalid @import value, you can only import fonts`,
  'only scope custom element':
    `Invalid @kaliber-scoped, you can only scope using custom elements`
}

module.exports = {
  ruleName: 'index',
  ruleInteraction: {
    'selector-policy': {
      tagSelectorsAllowCss: isIndex,
    },
    'at-rule-restrictions': {
      allowSpecificImport: rule => isIndex(rule.root()) && (
        rule.params.includes('font') ||
        messages['only import font']
      ),
      allowSpecificKaliberScoped: rule => isIndex(rule.root()) && (
        /[a-z]+(-[a-z]+)+/.test(rule.params) ||
        messages['only scope custom element']
      ),
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
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      const [classNode] = selector.filter(x => x.type === 'class')
      if (!classNode) return
      report(rule, messages['no class selectors'](classNode.value), classNode.sourceIndex + 1)
    })
  })
}

function isIndex(root) { return isFile(root, 'index.css') }
