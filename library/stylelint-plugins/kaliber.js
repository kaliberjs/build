const stylelint = require('stylelint')
const createPostcssModulesValuesResolver = require('postcss-modules-values')
const createPostcssCustomPropertiesResolver = require('postcss-custom-properties')
const createPostcssCustomMediaResolver = require('postcss-custom-media')
const createPostcssCustomSelectorsResolver = require('postcss-custom-selectors')
const createPostcssCalcResolver = require('postcss-calc')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')

const postcssModulesValuesResolver = createPostcssModulesValuesResolver()
const postcssCalcResolver = createPostcssCalcResolver()

const { matchesFile } = require('./machinery/filename')

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
const namingPolicy = require('./rules/naming-policy')
const selectorPolicy = require('./rules/selector-policy')
const parentChildPolicy = require('./rules/parent-child-policy')
const rootPolicy = require('./rules/root-policy')
const noImport = require('./rules/no-import')
const index = require('./rules/index')
const reset = require('./rules/reset')

const interaction = [colorSchemes, cssGlobal, layoutRelatedProperties, namingPolicy, selectorPolicy, parentChildPolicy, rootPolicy, noImport, index, reset].reduce(
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
    'no-import': [{
      allowImport: isEntryCss,
    }],
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
      allowTagSelectors = result.allowTagSelectors,
      allowImport = result.allowImport,
      allowSpecificImport = result.allowSpecificImport,
    }) => ({
      ...result,
      allowNonLayoutRelatedProperties: x => result.allowNonLayoutRelatedProperties(x) || allowNonLayoutRelatedProperties(x),
      allowDoubleChildSelectors: x => result.allowDoubleChildSelectors(x) || allowDoubleChildSelectors(x),
      allowNonDirectChildSelectors: x => result.allowNonDirectChildSelectors(x) || allowNonDirectChildSelectors(x),
      allowDeclInRoot: x => result.allowDeclInRoot(x) || allowDeclInRoot(x),
      allowTagSelectors: x => result.allowTagSelectors(x) || allowTagSelectors(x),
      allowImport: x => result.allowImport(x) || allowImport(x),
      allowSpecificImport: x => result.allowSpecificImport(x) || allowSpecificImport(x),
    }),
    {
      allowNonLayoutRelatedProperties: _ => false,
      allowDoubleChildSelectors: _ => false,
      allowNonDirectChildSelectors: _ => false,
      allowDeclInRoot: _ => false,
      allowTagSelectors: _ => false,
      allowImport: _ => false,
      allowSpecificImport: _ => false,
    }
  )
}

const rules = /** @type {any[] & { messages: { [key: string]: any } }} */ ([
  toPlugin(index),
  toPlugin(reset),
  toPlugin(colorSchemes),
  toPlugin(cssGlobal),
  toPlugin(layoutRelatedProperties),
  toPlugin(namingPolicy),
  toPlugin(selectorPolicy),
  toPlugin(parentChildPolicy),
  toPlugin(rootPolicy),
  toPlugin(noImport),
])
rules.messages = rules.reduce((result, x) => ({ ...result, ...x.rawMessages }), {})
module.exports = rules

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
      callPlugin(root)

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
          callPlugin(root)
        })

      function callPlugin(root) {
        plugin({ root, modifiedRoot: root, originalRoot, report, context })
      }

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

function isEntryCss(root) { return matchesFile(root, filename => filename.endsWith('.entry.css')) }
