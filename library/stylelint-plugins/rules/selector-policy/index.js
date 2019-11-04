const {
  declMatches, findDecls,
  parseValue, parseSelector,
  withRootRules, withNestedRules,
  isPseudoElement, isRoot, hasChildSelector,
  getParentRule, getChildSelectors,
} = require('../../machinery/ast')

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
}

module.exports = {
  ruleName: 'selector-policy',
  ruleInteraction: null,
  cssRequirements: {
    // resolvedCustomSelectors: true, TODO: add test case
  },
  messages,
  create({ allowNonDirectChildSelectors, allowDoubleChildSelectors, allowTagSelectors }) {
    return ({ originalRoot, modifiedRoot, report, context }) => {
      onlyDirectChildSelectors({ root: originalRoot, report, allowNonDirectChildSelectors })
      noDoubleNesting({ root: originalRoot, report })
      noChildSelectorsAtRoot({ root: originalRoot, report })
      noDoubleChildSelectorsInNested({ root: originalRoot, report, allowDoubleChildSelectors })
      noTagSelectors({ root: originalRoot, report, allowTagSelectors })
      noRulesInsideMedia({ root: originalRoot, report })
    }
  }
}

function onlyDirectChildSelectors({ root, report, allowNonDirectChildSelectors }) {
  if (allowNonDirectChildSelectors(root)) return
  root.walkRules(rule => {
    const root = parseSelector(rule)
    const combinators = root.first.filter(x => x.type === 'combinator')
    if (!combinators.length) return

    const [invalidCombinator] =  combinators.filter(x => x.value !== '>')
    if (!invalidCombinator) return
    if (invalidCombinator.value === ' ') {
      const { first } = root.first
      if (first && first.type === 'attribute' && first.attribute.startsWith('data-context-')) return
    }

    report(rule, messages['only direct child selectors'](invalidCombinator.value), invalidCombinator.sourceIndex)
  })
}

function noDoubleNesting({ root, report }) {
  withNestedRules(root, (rule, parent) => {
    if (isRoot(parent) || (!hasChildSelector(rule) && isRoot(getParentRule(parent)))) return
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

function noDoubleChildSelectorsInNested({ root, report, allowDoubleChildSelectors }) {
  if (allowDoubleChildSelectors(root)) return
  withNestedRules(root, (rule, parent) => {
    const [, double] = getChildSelectors(rule)
    if (double) {
      const i = double.sourceIndex
      const correctSourceIndex = double.type === 'pseudo' ? i + 1 : i // it might be fixed in version 3, but postcss-preset-env isn't there yet
      report(rule, messages['nested - no double child selectors'], correctSourceIndex)
    }
  })
}

function noTagSelectors({ root, report, allowTagSelectors }) {
  if (allowTagSelectors(root)) return
  root.walkRules(rule => {
    const { parent } = rule
    if (parent && parent.type === 'atrule' && parent.name === 'keyframes') return
    const root = parseSelector(rule)
    const [tag] = root.first.filter(x => x.type === 'tag')
    if (!tag) return
    report(rule, messages['no tag selectors'], tag.sourceIndex)
  })
}

function noRulesInsideMedia({ root, report }) {
  root.walkAtRules('media', rule => {
    rule.walkRules(rule => {
      report(rule, messages['media - no nested child'])
    })
  })
}
