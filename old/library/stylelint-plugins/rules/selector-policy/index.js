const {
  parseSelector,
  withRootRules, withNestedRules,
  isRoot, hasChildSelector,
  getParentRule, getChildSelectors, getRootRules,
} = require('../../machinery/ast')

const { isSelector } = require('postcss-selector-parser')

const messages = {
  'only direct child selectors': type =>
    `no \`${type}\` selector combinator\n` +
    `it is only allowed to use direct child selectors - ` +
    `restructure the css in a way that does not require this, if a third library forces ` +
    `you to use this type of selector, disable the rule for this line and add a comment ` +
    `stating the reason`,
  'nested - no double nesting':
    'no double nesting\n' +
    'nesting is only allowed one level - ' +
    'create a root rule and move the nested block there',
  'root - no child selectors':
    `no child selector at root level\n` +
    `it is not allowed to use child selectors on root level - ` +
    `write the child selector nested using the \`&\``,
  'nested - no double child selectors':
    `no double child selector in nested selector\n` +
    `it is not allowed to select the child of a child - ` +
    `write a separate root rule and select the child from there`,
  'no tag selectors':
    `no tag selectors\n` +
    `it is not allowed to select tags outside of reset.css and index.css - ` +
    `give the element a class and select on that or move to reset.css or index.css`,
  'media - no nested child':
    `unexpected rule in @media\n` +
    `@media should be placed inside rules and not the other way around - ` +
    `swap the selector and @media statement`,
  'invalid state selector': type =>
    `no \`${type}\` selector combinator\n` +
    `you can only use direct sibling selectors in combination with a universal state selector - ` +
    'change the selector to `*:checked +`'
}

module.exports = {
  ruleName: 'selector-policy',
  ruleInteraction: null,
  cssRequirements: {
    // resolvedCustomSelectors: true, TODO: add test case
  },
  messages,
  create({
    nonDirectChildSelectorsAllowCss,
    doubleSelectorsAllowCss,
    doubleSelectorsAllowRule,
    tagSelectorsAllowCss,
  }) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      onlyDirectChildSelectors({ root: originalRoot, report, nonDirectChildSelectorsAllowCss })
      noDoubleNesting({ root: originalRoot, report })
      noChildSelectorsAtRoot({ root: originalRoot, report })
      noDoubleChildSelectorsInNested({ root: originalRoot, report, doubleSelectorsAllowCss, doubleSelectorsAllowRule })
      noTagSelectors({ root: originalRoot, report, tagSelectorsAllowCss })
      noRulesInsideMedia({ root: originalRoot, report })
    }
  }
}

function onlyDirectChildSelectors({ root, report, nonDirectChildSelectorsAllowCss }) {
  if (nonDirectChildSelectorsAllowCss && nonDirectChildSelectorsAllowCss(root)) return
  root.walkRules(rule => {
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      const combinators = selector.filter(x => x.type === 'combinator')
      if (!combinators.length) return

      const [invalidCombinator] =  combinators.filter(x => x.value !== '>')
      if (!invalidCombinator) return
      const precedingSelector = invalidCombinator.prev()
      if (isStateSelector(precedingSelector)) {
        if (invalidCombinator.value === '+' && isUniversalStateSelector(precedingSelector.prev())) return
        report(rule, messages['invalid state selector'](invalidCombinator.value), invalidCombinator.sourceIndex)
        return
      }
      if (invalidCombinator.value === ' ') {
        if (isDataContextSelector(selector.first)) return
        const parent = getParentRule(rule)
        if (parent && isSvgSelector(parent)) return
        const [rootRule] = getRootRules(rule)
        const rootSelectors = parseSelector(rootRule)

        if (
          rootRule === parent &&
          rootSelectors.every(selector => isDataContextSelector(selector.first))
        ) return
      }

      report(rule, messages['only direct child selectors'](invalidCombinator.value), invalidCombinator.sourceIndex)
    })
  })
}

function noDoubleNesting({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    if (isRoot(parent) || (!hasChildSelector(rule) && isRoot(getParentRule(parent)))) return
    if (isSvgSelector(parent)) return
    report(rule, messages['nested - no double nesting'])
  })
}


function noChildSelectorsAtRoot({ root, report }) {
  withRootRules(root, rule => {
    parseSelector(rule).walkCombinators(x => {
      if (x.value === '>')
        report(rule, messages['root - no child selectors'], x.sourceIndex)
    })
  })
}

function noDoubleChildSelectorsInNested({ root, report, doubleSelectorsAllowCss, doubleSelectorsAllowRule }) {
  if (doubleSelectorsAllowCss && doubleSelectorsAllowCss(root)) return
  withNestedRules(root, (rule, parent) => {
    const selectors = getChildSelectors(rule)
    selectors.forEach(([, double]) => {
      if (!double) return
      if (doubleSelectorsAllowRule && doubleSelectorsAllowRule(rule)) return

      const i = double.sourceIndex
      const correctSourceIndex = double.type === 'pseudo' ? i + 1 : i // it might be fixed in version 3, but postcss-preset-env isn't there yet
      report(rule, messages['nested - no double child selectors'], correctSourceIndex)
    })
  })
}

function noTagSelectors({ root, report, tagSelectorsAllowCss }) {
  if (tagSelectorsAllowCss && tagSelectorsAllowCss(root)) return
  root.walkRules(rule => {
    const { parent } = rule
    if (parent && parent.type === 'atrule' && parent.name === 'keyframes') return
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      const [tag] = selector.filter(x => x.type === 'tag')
      if (!tag) return
      const parentRule = getParentRule(rule)
      if (isSvgSelector(rule)) return
      if (parentRule && isSvgSelector(parentRule)) return

      report(rule, messages['no tag selectors'], tag.sourceIndex)
    })
  })
}

function noRulesInsideMedia({ root, report }) {
  root.walkAtRules('media', rule => {
    rule.walkRules(rule => {
      report(rule, messages['media - no nested child'])
    })
  })
}

function isDataContextSelector(selector) {
  return selector && selector.type === 'attribute' && selector.attribute.startsWith('data-context-')
}

function isSvgSelector(rule) {
  const selectors = parseSelector(rule)
  return selectors.every(selector => {
    const [svg] = selector.filter(x => x.type === 'tag' && x.value === 'svg')
    return !!svg
  })
}

function isStateSelector(node) {
  return node && node.type === 'pseudo' && node.value === ':checked'
}

function isUniversalStateSelector(node) {
  return node && node.type === 'universal'
}
