const {
  declMatches, findDecls,
  parseValue, parseSelector,
  withRootRules, withNestedRules,
  isPseudoElement,
} = require('../../machinery/ast')
const { flexChildProps, gridChildProps } = require('../../machinery/css')

const intrinsicUnits = ['px', 'em', 'rem', 'vw', 'vh']
const intrinsicProps = ['width', 'height', 'max-width', 'min-width', 'max-height', 'min-height']

const allowedInRootAndChild = [
  ['position', 'relative'], // is safe to use
  'overflow', // is safe to use
  ['display', 'none'], // is safe to use
]

const layoutRelatedProps = [ // only allowed in child
  'z-index',
  'width', 'height',
  ['position', 'absolute'], ['position', 'fixed'],
  'top', 'right', 'bottom', 'left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'max-width', 'min-width', 'max-height', 'min-height',
  'justify-self', 'align-self',
  ...flexChildProps,
  ...gridChildProps,
  ...allowedInRootAndChild,
]
const layoutRelatedPropsWithValues = extractPropsWithValues(layoutRelatedProps)

const messages = {
  'root - no layout related props': prop =>
    `illegal layout related prop\n` +
    `\`${prop}\` can only be used by root rules in nested selectors - ` +
    `move to a nested selector in a another root rule, if you are forced by a third party ` +
    `library, you can rename your selector to \`_rootXyz\` or \`component_rootXyz\`` + (
      intrinsicProps.includes(prop)
      ? `\nif you are trying to define an intrinsic ${prop}, make sure you set the unit to ` +
        `one of \`${intrinsicUnits.join('`, `')}\` and add \`!important\``
      : ''
    ),
  'nested - only layout related props in nested':  prop =>
    `illegal non-layout related prop\n` +
    `\`${prop}\` can only be used by root rules - ` +
    `move to another root rule`,
}

module.exports = {
  ruleName: 'layout-related-properties',
  ruleInteraction: null,
  cssRequirements: {
    normalizedCss: true,
    resolvedCustomProperties: true,
    // resolvedCustomMedia: true, TODO: add test case (probably only possible when we have added correct resolution for)
    // resolvedCustomSelectors: true, TODO: add test case
    resolvedModuleValues: true,
    resolvedCalc: true,
  },
  messages,
  create({
    //rootAllowCss,
    rootAllowRule,
    rootAllowDecl,
    childAllowCss,
    // childAllowRule,
    childAllowDecl,
  }) {
    return ({ modifiedRoot, report }) => {
      noLayoutRelatedPropsInRoot({ modifiedRoot, report, rootAllowRule, rootAllowDecl })
      onlyLayoutRelatedPropsInNested({ modifiedRoot, report, childAllowCss, childAllowDecl })
    }
  }
}

function noLayoutRelatedPropsInRoot({ modifiedRoot, report, rootAllowRule, rootAllowDecl }) {
  withRootRules(modifiedRoot, rule => {
    if (rootAllowRule && rootAllowRule(rule)) return

    const decls = findDecls(rule, layoutRelatedProps)
    decls.forEach(decl => {
      if (declMatches(decl, intrinsicProps) && isIntrinsicValue(decl)) return
      if (isRatioHack(decl, rule)) return
      if (rootAllowDecl && rootAllowDecl(decl)) return
      if (declMatches(decl, allowedInRootAndChild)) return
      const { prop } = decl
      const hasValue = layoutRelatedPropsWithValues[prop]
      report(decl, messages['root - no layout related props'](prop + (hasValue ? `: ${decl.value}` : '')))
    })
  })
}

function onlyLayoutRelatedPropsInNested({ modifiedRoot, report, childAllowCss, childAllowDecl }) {
  if (childAllowCss && childAllowCss(modifiedRoot)) return
  withNestedRules(modifiedRoot, (rule, parent) => {
    const selectors = parseSelector(rule)
    selectors.each(selector => {
      const pseudos = selector.filter(isPseudoElement)
      if (pseudos.length) return
      const decls = findDecls(rule, layoutRelatedProps, { onlyInvalidTargets: true })
      decls.forEach(decl => {
        if (childAllowDecl && childAllowDecl(decl)) return
        report(decl, messages['nested - only layout related props in nested'](decl.prop))
      })
    })
  })
}

function isIntrinsicValue({ important, value }) {
  const [number] = parseValue(value).first.nodes.filter(x => x.type === 'number')
  return important && number && intrinsicUnits.includes(number.unit)
}

function isRatioHack({ prop, value }, rule) {
  return prop === 'height' && value === '0' && hasValidPadding(rule)

  function hasValidPadding(rule) {
    const decls = findDecls(rule, ['padding-bottom', 'padding-top'])
    return !!decls.length && decls.every(isPercentage)
  }

  function isPercentage({ value }) {
    const [number] = parseValue(value).first.nodes.filter(x => x.type === 'number')
    return number && number.unit === '%'
  }
}

function extractPropsWithValues(props) {
  return props.reduce(
    (result, x) => {
      if (Array.isArray(x)) {
        const [prop] = x
        return { ...result, [prop]: true }
      } else return result
    },
    {}
  )
}
