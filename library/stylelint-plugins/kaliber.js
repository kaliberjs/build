const stylelint = require('stylelint')
const path = require('path')
const createPostcssModulesValuesResolver = require('postcss-modules-values')
const createPostcssCustomPropertiesResolver = require('postcss-custom-properties')
const createPostcssCustomMediaResolver = require('postcss-custom-media')
const createPostcssCustomSelectorsResolver = require('postcss-custom-selectors')
const createPostcssCalcResolver = require('postcss-calc')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')

const postcssModulesValuesResolver = createPostcssModulesValuesResolver()
const postcssCalcResolver = createPostcssCalcResolver()

const { matchesFile } = require('./machinery/filename')
const { flexChildProps, gridChildProps } = require('./machinery/css')
const {
  declMatches, findDecls,
  parseSelector,
  withRootRules, withNestedRules,
  isRoot, hasChildSelector,
  getParentRule, getChildSelectors,
} = require('./machinery/ast')

const allowedInReset = [
  'width', 'height',
  'max-width', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
]

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
  rootHasPositionGrid: {
    nestedHasOneOf: gridChildProps,
    requireInRoot: [
      ['display', 'grid']
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

const colorSchemes = require('./rules/color-schemes')
const cssGlobal = require('./rules/css-global')
const layoutRelatedProperties = require('./rules/layout-related-properties')

const interaction = [colorSchemes, cssGlobal, layoutRelatedProperties].reduce(
  (result, { ruleInteraction }) => ({
    ...result,
    ...Object.entries(ruleInteraction || {}).reduce(
      (result, [rule, configuration]) => ({
        ...result,
        [rule]: [...(result[rule] || []), configuration]
      }),
      result
    )
  }),
  {
    'layout-related-properties': [{
      allowDeclInRoot: decl => isReset(decl.root()) && declMatches(decl, allowedInReset),
    }]
  }
)

function toPluginConfiguration(cssRequirements) {
  if (!cssRequirements) return { skipAll: true }
  const {
    normalizedMediaQueries = false,
    resolvedCustomProperties = false,
    resolvedCustomMedia = false,
    resolvedCustomSelectors = false,
    resolvedModuleValues = false,
    resolvedCalc = false,
  } = cssRequirements
  return {
    testWithNormalizedMediaQueries: normalizedMediaQueries,
    skipCustomPropertyResolving: !resolvedCustomProperties,
    skipCustomMediaResolving: !resolvedCustomMedia,
    skipCustomSelectorsResolving: !resolvedCustomSelectors,
    skipModulesValuesResolver: !resolvedModuleValues,
    skipCalcResolver: !resolvedCalc,
  }
}

const config = Object.entries(interaction).reduce(
  (result, [rule, configs]) => ({ ...result, [rule]: merge(configs) }),
  {}
)

function toPlugin({ cssRequirements, messages, ruleName, create }) {
  return createPlugin({
    ...toPluginConfiguration(cssRequirements),
    ruleName: `kaliber/${ruleName}`,
    messages,
    plugin: create(config[ruleName]),
  })
}

function merge(configs) {
  return configs.reduce(
    (result, {
      allowNonLayoutRelatedProperties = result.allowNonLayoutRelatedProperties,
      allowDoubleChildSelectors = result.allowDoubleChildSelectors,
      allowNonDirectChildSelectors = result.allowNonDirectChildSelectors,
      allowDeclInRoot = result.allowDeclInRoot,
    }) => ({
      ...result,
      allowNonLayoutRelatedProperties: x => result.allowNonLayoutRelatedProperties(x) || allowNonLayoutRelatedProperties(x),
      allowDoubleChildSelectors: x => result.allowDoubleChildSelectors(x) || allowDoubleChildSelectors(x),
      allowNonDirectChildSelectors: x => result.allowNonDirectChildSelectors(x) || allowNonDirectChildSelectors(x),
      allowDeclInRoot: x => result.allowDeclInRoot(x) || allowDeclInRoot(x),
    }),
    {
      allowNonLayoutRelatedProperties: _ => false,
      allowDoubleChildSelectors: _ => false,
      allowNonDirectChildSelectors: _ => false,
      allowDeclInRoot: _ => false,
    }
  )
}

const rules = /** @type {any[] & { messages: { [key: string]: any } }} */ ([
  // root-policy
  validStackingContextInRoot(),

  // parent-child-policy
  requireStackingContextInParent(),
  absoluteHasRelativeParent(),
  requireDisplayFlexInParent(),
  requireDisplayGridInParent(),
  validPointerEvents(),

  // selector-policy
  onlyDirectChildSelectors(config['selector-policy']),
  onlyTagSelectorsInResetAndIndex(config['selector-policy']),
  noDoubleNesting(config['selector-policy']),
  noChildSelectorsAtRoot(config['selector-policy']),
  noDoubleChildSelectorsInNested(config['selector-policy']),
  noTagSelectors(config['selector-policy']),
  noRulesInsideMedia(config['selector-policy']),

  toPlugin(colorSchemes),
  toPlugin(cssGlobal),
  toPlugin(layoutRelatedProperties),

  // no-import
  noImport(),

  // naming-policy
  noComponentNameInNested(),
  valueStartsWithUnderscore(),
  propertyLowerCase(),
  preventExportCollisions(),
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
        parseSelector(rule).walkClasses(x => {
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
        parseSelector(rule).walkCombinators(x => {
          if (x.value === '>')
            report(rule, messages['root - no child selectors'], x.sourceIndex)
        })
      })
    }
  })
}

function noDoubleChildSelectorsInNested({ allowDoubleChildSelectors }) {
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
        const root = parseSelector(rule)
        const [tag] = root.first.filter(x => x.type === 'tag')
        if (!tag) return
        report(rule, messages['no tag selectors'], tag.sourceIndex)
      })
    }
  })
}

function onlyDirectChildSelectors({ allowNonDirectChildSelectors }) {
  const messages = {
    'only direct child selectors': type =>
      `no \`${type}\` selector combinator\n` +
      `it is only allowed to use direct child selectors - ` +
      `restructure the css in a way that does not require this, if a third library forces ` +
      `you to use this type of selector, disable the rule for this line and add a comment ` +
      `stating the reason`,
     'no _root child selectors':
      `Unexpected _root selector\n` +
      `_root or component_root selectors can not be used as a child selector - ` +
      `remove the _root or component_root prefix`,
  }
  return createPlugin({
    ruleName: 'kaliber/only-direct-child-selectors',
    messages,
    plugin: ({ root, report }) => {
      if (allowNonDirectChildSelectors(root)) return
      root.walkRules(rule => {
        const root = parseSelector(rule)
        const combinators = root.first.filter(x => x.type === 'combinator')
        if (!combinators.length) return

        const [rootSelector] = root.first.filter(x =>
          x.type === 'class' && (x.value.startsWith('_root') || x.value.startsWith('component_root'))
        )
        if (rootSelector) report(rule, messages['no _root child selectors'], rootSelector.sourceIndex)

        const [invalidCombinator] =  combinators.filter(x => x.value !== '>')
        if (!invalidCombinator) return
        if (invalidCombinator.value === ' ') {
          const { first } = root.first
          if (first && first.type === 'attribute' && first.attribute.startsWith('data-context-')) return
        }

        report(rule, messages['only direct child selectors'](invalidCombinator.value), invalidCombinator.sourceIndex)
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

function requireDisplayGridInParent() {
  const messages = {
    'nested - require display grid in parent': prop =>
      `missing \`display: grid;\`\n` +
      `\`${prop}\` can only be used when the containing root rule has \`display: grid;\` - ` +
      `add \`display: grid;\` to the containing root rule`,
  }
  return createPlugin({
    ruleName: 'kaliber/valid-grid-context-in-root',
    messages,
    testWithNormalizedMediaQueries: true,
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const result = checkChildParentRelation(rule, childParentRelations.rootHasPositionGrid)

        result.forEach(({ result, prop, triggerDecl, rootDecl, value, expectedValue }) => {
          report(triggerDecl, messages['nested - require display grid in parent'](triggerDecl.prop))
        })
      })
    }
  })
}

function noRulesInsideMedia() {
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
        const root = parseSelector(rule)
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

function noImport() {
  const messages = {
    'no import':
      `Unexpected @import\n` +
      `you can only use @import in \`*.entry.css\` files or in \`index.css\` files - ` +
      `you might not need the import, for custom variables, custom media and custom selectors you can place the code in \`src/cssGlobal/\`\n` +
      `in other cases try another method of reuse, for example create another class`,
    'only import font':
      `Invalid @import value\n` +
      `you can only import fonts`
  }
  return createPlugin({
    ruleName: 'kaliber/no-import',
    messages,
    plugin: ({ root, report }) => {
      const index = isIndex(root)
      if (isEntryCss(root)) return
      root.walkAtRules(rule => {
        if (rule.name !== 'import') return
        if (index) {
          if (rule.params.includes('font')) return
          report(rule, messages['only import font'])
        } else {
          report(rule, messages['no import'])
        }
      })
    }
  })
}

function valueStartsWithUnderscore() {
  const messages = {
    'value should start with underscore':
      `Expected underscore \`_\`\n` +
      `to prevent conflicts all values should start with an underscore - ` +
      `prefix the value with an underscore or, if you want to export a value, use \`:export { ... }\``
  }
  return createPlugin({
    ruleName: 'kaliber/value-starts-with-underscore',
    messages,
    skipModulesValuesResolver: true,
    skipCalcResolver: true,
    plugin: ({ root, report }) => {
      root.walkAtRules('value', rule => {
        if (rule.params.startsWith('_')) return

        report(rule, messages['value should start with underscore'], 8)
      })
    }
  })
}

function propertyLowerCase() {
  const messages = {
    'property lower case': (actual, expected) =>
      `Expected "${actual}" to be "${expected}"`
  }
  return createPlugin({
    ruleName: 'kaliber/property-lower-case',
    messages,
    skipAll: true,
    plugin: ({ root, report, context }) => {
      root.walkDecls(decl => {
        const { prop, parent } = decl

        if (prop.startsWith('--')) return

        const expectedProp = prop.toLowerCase()

        if (prop === expectedProp) return
        if (parent.type === 'rule' && parent.selector === ':export') return
        if (context.fix) {
          decl.prop = expectedProp
          return
        }

        report(decl, messages['property lower case'](prop, expectedProp))
      })
    }
  })
}

function preventExportCollisions() {
  const messages = {
    'export collision':
      `Detected export collision\n` +
      `a class is exported with this exact name - ` +
      `rename the export`
  }
  return createPlugin({
    ruleName: 'kaliber/prevent-export-collisions',
    messages,
    skipAll: true,
    plugin: ({ root, report }) => {
      const classes = []
      root.walkRules(rule => {
        parseSelector(rule).walkClasses(x => { classes.push(x.value) })
      })
      root.walkRules(':export', rule => {
        rule.each(node => {
          if (node.type !== 'decl') return
          if (!classes.includes(node.prop)) return
          report(node, messages['export collision'])
        })
      })
    }
  })
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

function createPlugin({
  ruleName, messages, plugin,
  testWithNormalizedMediaQueries = false,
  skipAll = false,
  skipCustomPropertyResolving = skipAll,
  skipCustomMediaResolving = skipAll,
  skipCustomSelectorsResolving = skipAll,
  skipModulesValuesResolver = skipAll,
  skipCalcResolver = skipAll,
}) {
  const stylelintPlugin = stylelint.createPlugin(ruleName, pluginWrapper)

  return {
    ...stylelintPlugin,
    rawMessages: messages,
    messages: stylelint.utils.ruleMessages(ruleName, messages),
  }

  function pluginWrapper(primaryOption, secondaryOptionObject, context) {
    return async (originalRoot, result) => {
      const check = { actual: primaryOption, possible: [true] }
      if (!stylelint.utils.validateOptions(result, ruleName, check)) return

      const reported = {}
      const importFrom = findCssGlobalFiles(originalRoot.source.input.file)

      const needsClone =
        testWithNormalizedMediaQueries ||
        !skipCustomPropertyResolving ||
        !skipCustomMediaResolving ||
        !skipCustomSelectorsResolving ||
        !skipModulesValuesResolver ||
        !skipCalcResolver

      const root = needsClone ? originalRoot.clone() : originalRoot
      if (!skipModulesValuesResolver) {
        await postcssModulesValuesResolver(root, result)
      }
      if (!skipCustomPropertyResolving) {
        const postcssCustomPropertiesResolver = createPostcssCustomPropertiesResolver({ preserve: false, importFrom })
        await postcssCustomPropertiesResolver(root, result)
      }
      if (!skipCustomMediaResolving) {
        const postcssCustomMediaResolver = createPostcssCustomMediaResolver({ preserve: false, importFrom })
        await postcssCustomMediaResolver(root, result)
      }
      if (!skipCustomSelectorsResolving) {
        const postcssCustomSelectorsResolver = createPostcssCustomSelectorsResolver({ preserve: false, importFrom })
        await postcssCustomSelectorsResolver(root, result)
      }
      if (!skipCalcResolver) {
        await postcssCalcResolver(root, result)
      }
      plugin({ root, report, context })

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
        if (!node.source) stylelint.utils.report({
          message: `A generated node (${getNodeId(node)}) caused a problem\n  ${node.toString().split('\n').join('\n  ')}\n${message}`,
          node: node.parent, result, ruleName
        })
        else stylelint.utils.report({ message, index, node, result, ruleName })
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

function isReset(root) { return isFile(root, 'reset.css') }
function isIndex(root) { return isFile(root, 'index.css') }
function isEntryCss(root) { return matchesFile(root, filename => filename.endsWith('.entry.css')) }

function isFile(root, name) {
  return matchesFile(root, filename => path.basename(filename) === name)
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
