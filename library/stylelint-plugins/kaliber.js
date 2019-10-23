const stylelint = require('stylelint')
const createSelectorParser = require('postcss-selector-parser')
const createValueParser = require('postcss-values-parser')
const selectorParser = createSelectorParser()
const path = require('path')
const createPostcssModulesValuesResolver = require('postcss-modules-values')
const createPostcssCustomPropertiesResolver = require('postcss-custom-properties')
const createPostcssCustomMediaResolver = require('postcss-custom-media')
const createPostcssCalcResolver = require('postcss-calc')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')

const postcssModulesValuesResolver = createPostcssModulesValuesResolver()
const postcssCalcResolver = createPostcssCalcResolver()

function parseValue(value) { return createValueParser(value).parse() }

const allowedInReset = [
  'width', 'height',
  'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
]

const flexChildProps = [
  'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'order',
]

const allowedInRootAndChild = [
  'z-index',  // handled by valid-stacking-context-in-root
  ['position', 'relative'], // is safe to use
  'overflow', // is safe to use
  'pointer-events', // handled by valid-pointer-events
]

const layoutRelatedProps = [ // only allowed in child
  'width', 'height',
  ['position', 'absolute'], ['position', 'fixed'],
  'top', 'right', 'bottom', 'left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'max-width', 'min-width', 'max-height', 'min-height',
  ...flexChildProps,
  ...allowedInRootAndChild,
]
const layoutRelatedPropsWithValues = extractPropsWithValues(layoutRelatedProps)

const intrinsicUnits = ['px', 'em', 'rem', 'vw', 'vh']
const intrinsicProps = ['width', 'height', 'max-width', 'min-width', 'max-height', 'min-height']

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
  rootHasPositionFlex: {
    nestedHasOneOf: flexChildProps,
    requireInRoot: [
      ['display', 'flex']
    ]
  },
  validPointerEvents: {
    nestedHasOneOf: ['pointer-events'],
    requireInRoot: [
      ['pointer-events', 'none']
    ]
  },
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

/*
  Motivation

  Without these (and some eslint) rules html and css will be tied together in a way
  that prevents reuse. Every html element in the code is a potential component, without
  these rules it becomes quite tricky to turn a select set of tags into a component. The
  css often ties it together in a way that makes it quite hard to extract the correct parts
  for the component. This results in people copy/pasting large sections and adjusting them
  to their needs.
*/

const rules = /** @type {any[] & { messages: { [key: string]: any } }} */ ([
  requireStackingContextInParent(),
  absoluteHasRelativeParent(),
  requireDisplayFlexInParent(),
  validStackingContextInRoot(),
  noLayoutRelatedPropsInRoot(),
  onlyLayoutRelatedPropsInNested(),
  noDoubleNesting(),
  noComponentNameInNested(),
  noChildSelectorsAtRoot(),
  noDoubleChildSelectorsInNested(),
  noTagSelectors(),
  onlyDirectChildSelectors(),
  noChildElementSelectorsInMedia(),
  onlyTagSelectorsInResetAndIndex(),
  validPointerEvents(),
])
rules.messages = rules.reduce((result, x) => ({ ...result, ...x.rawMessages }), {})
module.exports = rules

function absoluteHasRelativeParent() {
  const messages = {
    'nested - absolute has relative parent':
      'missing `position: relative;` in parent\n' +
      '`position: absolute` is only allowed when the containing root rule is set to `position: relative` -' +
      'add `position: relative;` to the containing root rule'
  }
  return createPlugin({
    ruleName: 'kaliber/absolute-has-relative-parent',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const result = checkChildParentRelation(rule, childParentRelations.absoluteHasRelativeParent)

        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          report(triggerDecl, messages['nested - absolute has relative parent'])
        })
      })
    }
  })
}

function noDoubleNesting() {
  const messages = {
    'nested - no double nesting':
      'no double nesting\n' +
      'nesting is only allowed one level - ' +
      'create a root rule and move the nested block there'
  }
  return createPlugin({
    ruleName: 'kaliber/no-double-nesting',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        if (isRoot(parent) || (!hasChildSelector(rule) && isRoot(getParentRule(parent)))) return
        report(rule, messages['nested - no double nesting'])
      })
    }
  })
}

function requireStackingContextInParent() {
  const messages = {
    'nested - missing stacking context in parent':
      'missing stacking context (`position: relative; z-index: 0;`)\n' +
      '`z-index` can only be used when the containing root rule creates a new stacking context - ' +
      'add `position: relative;` and `z-index: 0` to the containing root rule',
  }
  return createPlugin({
    ruleName: 'kaliber/require-stacking-context-in-parent',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const result = checkChildParentRelation(rule, childParentRelations.validStackingContextInRoot)

        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          report(triggerDecl, messages['nested - missing stacking context in parent'])
        })
      })
    },
  })
}

function validStackingContextInRoot() {
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
  return createPlugin({
    ruleName: 'kaliber/valid-stacking-context-in-root',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {

        const result = checkRootCombo(rule, rootCombos.validStackingContext)

        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          if (prop === 'position') report(triggerDecl, messages['root - z-index without position relative'])
          if (prop === 'z-index') report(triggerDecl, messages['root - z-index not 0'])
        })
      })
    },
  })
}

function noLayoutRelatedPropsInRoot() {
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
      )
  }
  return createPlugin({
    ruleName: 'kaliber/no-layout-related-props-in-root',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      const reset = isReset(root)
      withRootRules(root, rule => {

        const isRoot = rule.selector.startsWith('._root') || rule.selector.startsWith('.component_root')
        if (isRoot) return

        const decls = findDecls(rule, layoutRelatedProps)
        decls.forEach(decl => {
          if (matches(decl, intrinsicProps) && isIntrinsicValue(decl)) return
          if (isRatioHack(decl, rule)) return
          if (reset && matches(decl, allowedInReset)) return
          if (matches(decl, allowedInRootAndChild)) return
          const { prop } = decl
          const hasValue = layoutRelatedPropsWithValues[prop]
          report(decl, messages['root - no layout related props'](prop + (hasValue ? `: ${decl.value}` : '')))
        })
      })
    }
  })

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
}

function onlyLayoutRelatedPropsInNested() {
  const messages = {
    'nested - only layout related props in nested':  prop =>
      `illegal non-layout related prop\n` +
      `\`${prop}\` can only be used by root rules - ` +
      `move to another root rule`
  }
  return createPlugin({
    ruleName: 'kaliber/only-layout-related-props-in-nested',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const root = selectorParser.astSync(rule)
        const pseudos = root.first.filter(x => x.type === 'pseudo')
        if (pseudos.length) return
        const decls = findDecls(rule, layoutRelatedProps, { onlyInvalidTargets: true })
        decls.forEach(decl => {
          report(decl, messages['nested - only layout related props in nested'](decl.prop))
        })
      })
    }
  })
}

function noComponentNameInNested() {
  const messages = {
    'nested - no component class name in nested': className =>
      `illegal class name\n` +
      `\`${className}\` can not be used in nested selectors - ` +
      `remove \`component\` from the name`
  }
  return createPlugin({
    ruleName: 'kaliber/no-component-class-name-in-nested',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        selectorParser.astSync(rule).walkClasses(x => {
          const className = x.value
          if (className.startsWith('component'))
            report(rule, messages['nested - no component class name in nested'](className), x.sourceIndex)
        })
      })
    }
  })
}

function noChildSelectorsAtRoot() {
  const messages = {
    'root - no child selectors':
      `no child selector at root level\n` +
      `it is not allowed to use child selectors on root level - ` +
      `write the child selector nested using the \`&\``
  }
  return createPlugin({
    ruleName: 'kaliber/no-child-selectors-in-root',
    messages,
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {
        selectorParser.astSync(rule).walkCombinators(x => {
          if (x.value === '>')
            report(rule, messages['root - no child selectors'], x.sourceIndex)
        })
      })
    }
  })
}

function noDoubleChildSelectorsInNested() {
  const messages = {
    'nested - no double child selectors':
      `no double child selector in nested selector\n` +
      `it is not allowed to select the child of a child - ` +
      `write a separate root rule and select the child from there`
  }
  return createPlugin({
    ruleName: 'kaliber/no-double-child-selectors-in-nested',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const [, double] = getChildSelectors(rule)
        if (double) {
          const i = double.sourceIndex
          const correctSourceIndex = double.type === 'pseudo' ? i + 1 : i // it might be fixed in version 3, but postcss-preset-env isn't there yet
          report(rule, messages['nested - no double child selectors'], correctSourceIndex)
        }
      })
    }
  })
}

function noTagSelectors() {
  const messages = {
    'no tag selectors':
      `no tag selectors\n` +
      `it is not allowed to select tags outside of reset.css and index.css - ` +
      `give the element a class and select on that or move to reset.css or index.css`
  }
  return createPlugin({
    ruleName: 'kaliber/no-tag-selectors',
    messages,
    plugin: ({ root, report }) => {
      if (isReset(root) || isIndex(root)) return
      root.walkRules(rule => {
        const { parent } = rule
        if (parent && parent.type === 'atrule' && parent.name === 'keyframes') return
        const root = selectorParser.astSync(rule)
        const [tag] = root.first.filter(x => x.type === 'tag')
        if (tag)
          report(rule, messages['no tag selectors'], tag.sourceIndex)
      })
    }
  })
}

function onlyDirectChildSelectors() {
  const messages = {
    'only direct child selectors': type =>
     `no \`${type}\` selector combinator\n` +
     `it is only allowed to use direct child selectors - ` +
     `restructure the css in a way that does not require this, if a third library forces ` +
     `you to use this type of selector, disable the rule for this line and add a comment ` +
     `stating the reason`
  }
  return createPlugin({
    ruleName: 'kaliber/only-direct-child-selectors',
    messages,
    plugin: ({ root, report }) => {
      root.walkRules(rule => {
        const root = selectorParser.astSync(rule)
        const [combinator] = root.first.filter(x => x.type === 'combinator' && x.value !== '>')
        if (combinator)
          report(rule, messages['only direct child selectors'](combinator.value), combinator.sourceIndex)
      })
    }
  })
}

function requireDisplayFlexInParent() {
  const messages = {
    'nested - require display flex in parent': prop =>
      `missing \`display: flex;\`\n` +
      `\`${prop}\` can only be used when the containing root rule has \`display: flex;\` - ` +
      `add \`display: flex;\` to the containing root rule`,
  }
  return createPlugin({
    ruleName: 'kaliber/valid-flex-context-in-root',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const result = checkChildParentRelation(rule, childParentRelations.rootHasPositionFlex)

        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          report(triggerDecl, messages['nested - require display flex in parent'](triggerDecl.prop))
        })
      })
    }
  })
}

function noChildElementSelectorsInMedia() {
  const messages = {
    'media - no nested child':
      `unexpected rule in @media\n` +
      `@media should be placed inside rules and not the other way around - ` +
      `swap the selector and @media statement`
  }
  return createPlugin({
    ruleName: 'kaliber/media-no-child',
    messages,
    plugin: ({ root, report }) => {
      root.walkAtRules('media', rule => {
        rule.walkRules(rule => {
          report(rule, messages['media - no nested child'])
        })
      })
    }
  })
}

function onlyTagSelectorsInResetAndIndex() {
  const messages = {
    'no class selectors':
      `Unexpected class selector\n` +
      `only tag selectors are allowed in index.css and reset.css - ` +
      `move the selector to another file or wrap it in \`:global(...)\``
  }
  return createPlugin({
    ruleName: 'kaliber/only-tag-selectors-in-reset-and-index',
    messages,
    plugin: ({ root, report }) => {
      if (!isReset(root) && !isIndex(root)) return
      root.walkRules(rule => {
        const root = selectorParser.astSync(rule)
        const [classNode] = root.first.filter(x => x.type === 'class')
        if (!classNode) return
        report(rule, messages['no class selectors'], classNode.sourceIndex + 1)
      })
    }
  })
}

function validPointerEvents() {
  const messages = {
    'invalid pointer events':
      `Incorrect pointer events combination\n` +
      `you can only set pointer events in a child if the parent disables pointer events - ` +
      `add pointer-events: none to parent`
  }
  return createPlugin({
    ruleName: 'kaliber/valid-pointer-events',
    messages,
    plugin: ({ root, report }) => {
      withNestedRules(root, rule => {
        const result = checkChildParentRelation(rule, childParentRelations.validPointerEvents)
        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          report(triggerDecl, messages['invalid pointer events'])
        })
      })
    }
  })
}

function hasChildSelector(rule) {
  return !!getChildSelectors(rule).length
}

function getChildSelectors(rule) {
  const root = selectorParser.astSync(rule)
  return root.first.filter(x =>
    x.type === 'combinator' ||
    (x.type === 'pseudo' && x.value.startsWith('::'))
  )
}

function splitByMediaQueries(root) {
  const mediaQueries = gatherMediaQueries(root)

  const clone = root.clone()
  clone.walkAtRules('media', x => { x.remove() })

  const byMediaQueries = mediaQueries.reduce(
    (result, params) => {
      const clone = root.clone()

      extractAndRemoveMediaRules(clone, params)
        .forEach(({ parent, rule }) => { merge(rule, parent) })

      return { ...result, [params]: clone }
    },
    { '': clone }
  )

  return byMediaQueries

  function gatherMediaQueries(root) {
    const mediaQueries = {}
    root.walkAtRules('media', ({ params }) => { mediaQueries[params] = true })
    return Object.keys(mediaQueries)
  }

  function extractAndRemoveMediaRules(container, params) {
    const atRules = []
    container.walkAtRules('media', rule => {
      const { parent } = rule
      rule.remove()
      if (rule.params === params) atRules.push({ parent, rule })
    })
    return atRules
  }

  function merge(source, target) {
    const ruleLookup = {}
    const declLookup = {}
    target.each(x => {
      if (x.type === 'rule') ruleLookup[x.selector] = x
      if (x.type === 'decl') declLookup[x.prop] = x
    })

    source.each(x => {
      if (x.type === 'decl') {
        const existing = declLookup[x.prop]
        if (existing) existing.replaceWith(x)
        else target.append(x)
      }

      if (x.type === 'rule') {
        const existing = ruleLookup[x.selector]
        if (existing) merge(x, existing)
        else target.append(x)
      }

      if (x.type === 'atrule') target.append(x)
    })
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

function withNestedRules(root, f) {
  root.walkRules(rule => {
    if (isRoot(rule)) return
    f(rule, getParentRule(rule))
  })
}

function withRootRules(root, f) {
  root.walkRules(rule => {
    if (!isRoot(rule)) return
    f(rule)
  })
}

function isRoot(rule) {
  const parent = getParentRule(rule)
  return !parent || (isRoot(parent) && !hasChildSelector(rule))
}

function findDecls(rule, targets, { onlyInvalidTargets = false } = {}) {
  let result = []
  const normalizedTargets = normalize(targets)

  rule.each(node => {
    if (
      node.type !== 'decl' ||
      (onlyInvalidTargets && !invalidTarget(normalizedTargets, node)) ||
      (!onlyInvalidTargets && invalidTarget(normalizedTargets, node))
    ) return

    result.push(node)
    const continueIteration = !onlyInvalidTargets && result.length !== targets.length
    return continueIteration
  })

  return result
}

function matches(decl, targets) {
  const normalizedTargets = normalize(targets)
  return !invalidTarget(normalizedTargets, decl)
}

function normalize(targets) {
  return targets.reduce(
    (result, x) => {
      const [name, value] = Array.isArray(x) ? x : [x, []]
      const values = result[name] || []
      return { ...result, [name]: values.concat(value) }
    },
    {}
  )
}

function invalidTarget(targets, { prop, value }) {
  const hasProp = targets.hasOwnProperty(prop)
  const targetValue = targets[prop]
  return !hasProp || (!!targetValue.length && !targetValue.includes(value))
}

function findDecl(rule, target) {
  const [result] = findDecls(rule, [target])
  return result
}

function missingProps(target, requiredProps) {
  const actualProps = getProps(target)
  return Object.entries(requiredProps).reduce(
    (invalid, [prop, value]) => invalid || actualProps[prop] !== value,
    false
  )
}

function createPlugin({ ruleName, messages, plugin, testWithNormalizedMediaQueries = false }) {
  const stylelintPlugin = stylelint.createPlugin(ruleName, pluginWrapper)

  return {
    ...stylelintPlugin,
    rawMessages: messages,
    messages: stylelint.utils.ruleMessages(ruleName, messages),
    ruleName
  }

  function pluginWrapper(primaryOption, secondaryOptionObject) {
    return async (originalRoot, result) => {
      const check = { actual: primaryOption, possible: [true] }
      if (!stylelint.utils.validateOptions(result, ruleName, check)) return

      const reported = {}
      const importFrom = findCssGlobalFiles(originalRoot.source.input.file)
      const postcssCustomPropertiesResolver = createPostcssCustomPropertiesResolver({ preserve: false, importFrom })
      const postcssCustomMediaResolver = createPostcssCustomMediaResolver({ preserve: false, importFrom })

      const root = originalRoot.clone()
      await postcssModulesValuesResolver(root, result)
      await postcssCustomPropertiesResolver(root, result)
      await postcssCustomMediaResolver(root, result)
      await postcssCalcResolver(root, result)
      plugin({ root, report })

      /*
        We create new root nodes for each applicable media query.

        This is not a complete solution. Multiple media queries apply, and we now only check for
        'same param queries'. This means that we might falsly report or miss some errors. We can
        only make a full solution if we have a string params policy that allows us to sort and apply
        the correct queries. An example (assuming that when y applies, x applies as well):

          .test {
            @media x {
              position: relative;
            }
            @media y {
              z-index: 0;

              & > * {
                position: absolute;
                z-index: 1;
              }
            }
          }

        This implementation splits it for each plugin. This might be a performance problem. The easy
        solution would be to create a `kaliber/style-lint` plugin/rule. That rule would be the only
        rule that is configured in .stylelintrc. It would split the root once and then run the
        different rules manually (stylelint.rules['kaliber/xyz'](...)(splitRoot, result)).
      */
      if (testWithNormalizedMediaQueries)
        Object.entries(splitByMediaQueries(root)).forEach(([mediaQuery, root]) => {
          plugin({ root, report })
        })

      function report(node, message, index) {
        const id = getId(node, message, index)
        if (reported[id]) return
        else reported[id] = true
        stylelint.utils.report({ message, index, node, result, ruleName })
      }

      function getId(node, message, index) {
        return `${getNodeId(node)}-${message}${index}`
      }

      function getNodeId({ type, prop, selector, params, parent }) {
        const nodeId =
          type === 'decl' ? `decl-${prop}` :
          type === 'rule' ? `rule-${selector}` :
          type === 'atrule' ? `atrule-${params}` :
          type

        const parentId = parent
          ? `${getNodeId(parent)}-`
          : ''

        return `${parentId}${nodeId}`
      }
    }
  }
}

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

function isReset(root) { return isFile(root, 'reset.css') }

function isIndex(root) { return isFile(root, 'index.css') }

function isFile({ source: { input } }, name) {
  return !!input.file && path.basename(input.file) === name
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

function checkRootCombo(rootRule, { rootHasOneOf, require }) {
  if (!isRoot(rootRule)) throw new Error('You should not call this function with a non-root rule')

  return checkRuleRelation({
    rule: rootRule,
    triggerProperties: rootHasOneOf,
    rulesToCheck: getRootRules(rootRule),
    requiredProperties: require
  })
}

function checkRuleRelation({ rule, triggerProperties, rulesToCheck, requiredProperties }) {
  const triggerDecls = findDecls(rule, triggerProperties)
  const relationApplicable = !!triggerDecls.length
  if (!relationApplicable) return []

  const normalizedRequiredProperties = requiredProperties.map(x => {
    const [prop] = Array.isArray(x) ? x : [x]
    return prop
  })
  const resolvedPropDecls =
    rulesToCheck.reduce(
      (result, rootRule) => ({
        ...result,
        ...findDecls(rootRule, normalizedRequiredProperties).reduce(
          (result, x) => ({ ...result, [x.prop]: x }),
          {}
        )
      }),
      {}
    )

  return requiredProperties
    .map(
      x => {
        const [prop, expectedValue] = Array.isArray(x) ? x : [x]
        const invalidDecl = resolvedPropDecls[prop]
        if (!invalidDecl) return { result: 'missing', prop }
        if (!expectedValue) return
        const { value } = invalidDecl
        if (value === expectedValue) return
        return { result: 'invalid', prop, invalidDecl, value, expectedValue }
      }
    )
    .filter(Boolean)
    .reduce(
      (result, x) => [
        ...result,
        ...triggerDecls.map(triggerDecl => ({ ...x, triggerDecl }))
      ],
      []
    )
}

function getRootRules(node) {
  if (!node) return []
  const parent = getParentRule(node)
  if (isRoot(node)) return getRootRules(parent).concat(node)
  return getRootRules(parent)
}
