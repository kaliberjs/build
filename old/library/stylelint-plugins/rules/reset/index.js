const { declMatches, parseSelector } = require('../../machinery/ast')
const { isFile } = require('../../machinery/filename')

const allowedInReset = [
  'width', 'height',
  'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
]

const messages = {
  'no class selectors': selector =>
    `Unexpected class selector '${selector}', only tag selectors are allowed in reset.css`,
  'only scope custom element':
    `Invalid @kaliber-scoped, you can only scope using custom elements`
}

module.exports = {
  ruleName: 'reset',
  ruleInteraction: {
    'layout-related-properties': {
      rootAllowDecl: decl => isReset(decl.root()) && declMatches(decl, allowedInReset),
    },
    'selector-policy': {
      tagSelectorsAllowCss: isReset
    },
    'at-rule-restrictions': {
      allowSpecificKaliberScoped: rule => isReset(rule.root()) && (
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
      onlyTagSelectorsInReset({ root: modifiedRoot, report })
    }
  }
}

function onlyTagSelectorsInReset({ root, report }) {
  if (!isReset(root)) return
  root.walkRules(rule => {
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      let [classNode] = selector.filter(x => x.type === 'class')
      const [globalNode] = selector.filter(x => x.type === 'pseudo' && x.value === ':global')
      if (!classNode) {
        if (!globalNode) return
        [classNode] = globalNode.first.filter(x => x.type === 'class')
      }
      report(rule, messages['no class selectors'](classNode.value), classNode.sourceIndex + 1)
    })
  })
}

function isReset(root) { return isFile(root, 'reset.css') }
