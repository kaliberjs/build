const stylelint = require('stylelint')
const createPostcssModulesValuesResolver = require('postcss-modules-values')
const createPostcssCustomPropertiesResolver = require('postcss-custom-properties')
const createPostcssCustomMediaResolver = require('postcss-custom-media')
const createPostcssCustomSelectorsResolver = require('postcss-custom-selectors')
const createPostcssCalcResolver = require('postcss-calc')
const { findCssGlobalFiles } = require('../lib/findCssGlobalFiles')
const { getNormalizedRoots } = require('./machinery/ast')

const postcssModulesValuesResolver = createPostcssModulesValuesResolver()
const postcssCalcResolver = createPostcssCalcResolver()

/*
  Motivation

  Without these (and some eslint) rules html and css will be tied together in a way
  that prevents reuse. Every html element in the code is a potential component, without
  these rules it becomes quite tricky to turn a select set of tags into a component. The
  css often ties it together in a way that makes it quite hard to extract the correct parts
  for the component. This results in people copy/pasting large sections and adjusting them
  to their needs.
*/

const rules = toStyleLintPlugins(
  require('./rules/color-schemes'),
  require('./rules/css-global'),
  require('./rules/layout-related-properties'),
  require('./rules/naming-policy'),
  require('./rules/selector-policy'),
  require('./rules/parent-child-policy'),
  require('./rules/root-policy'),
  require('./rules/at-rule-restrictions'),
  require('./rules/index'),
  require('./rules/reset'),
)
module.exports = rules

function toStyleLintPlugins(...rules) {
  const ruleInteraction = determineRuleInteraction(rules)
  const ruleConfiguration = convertToConfiguration(ruleInteraction)

  return rules.map(({ ruleName, cssRequirements, create }) =>
    createPlugin({
      ...(cssRequirements || {}),
      ruleName: `kaliber/${ruleName}`,
      plugin: create(ruleConfiguration[ruleName] || {}),
    })
  )
}

function determineRuleInteraction(rules) {
  /*
    [{ ruleInteraction: { ruleA: { b: c } } }, { ruleInteraction: { ruleA: { c: d } } }, ...]

    to

    { ruleA: [{ b: c }, { c: d }], ... }
  */
  return rules.reduce(
    (result, rule) => ({
      ...result,
      ...Object.entries(rule.ruleInteraction || {}).reduce(
        (result, [rule, config]) => ({
          ...result,
          [rule]: [...(result[rule] || []), config]
        }),
        result
      )
    }),
    {}
  )
}

function convertToConfiguration(ruleInteraction) {
  /*
    { ruleA: [{ a: b }, { a: c }, { b: d }], ... }

    to

    { ruleA" { a: b or c, b: d }, ... }
  */
  return Object.entries(ruleInteraction).reduce(
    (result, [rule, configs]) => ({ ...result, [rule]: merge(configs) }),
    {}
  )

  function merge(configs) {
    return configs.reduce(
      (result, config) => Object.entries(config).reduce(
        (result, [key, value]) => {
          if (typeof value !== 'function') throw new Error(`don't know how to handle config value`)
          const existing = result[key]
          return { ...result, [key]: existing ? x => existing(x) || value(x) : value }
        },
        result
      ),
      {}
    )
  }
}

function createPlugin({
  ruleName, plugin,
  normalizedCss = false,
  resolvedCustomProperties = false,
  resolvedCustomMedia = false,
  resolvedCustomSelectors = false,
  resolvedModuleValues = false,
  resolvedCalc = false,
}) {
  const stylelintPlugin = stylelint.createPlugin(ruleName, pluginWrapper)

  return {
    ...stylelintPlugin,
  }

  function pluginWrapper(primaryOption, secondaryOptionObject, context) {
    return async (originalRoot, result) => {
      const check = { actual: primaryOption, possible: [true] }
      if (!stylelint.utils.validateOptions(result, ruleName, check)) return

      const reported = {}
      const importFrom = findCssGlobalFiles(originalRoot.source.input.file)

      const modifiedRoot = originalRoot.clone()
      if (resolvedModuleValues) {
        await postcssModulesValuesResolver(modifiedRoot, result)
      }
      if (resolvedCustomProperties) {
        const postcssCustomPropertiesResolver = createPostcssCustomPropertiesResolver({ preserve: false, importFrom })
        await postcssCustomPropertiesResolver(modifiedRoot, result)
      }
      if (resolvedCustomMedia) {
        const postcssCustomMediaResolver = createPostcssCustomMediaResolver({ preserve: false, importFrom })
        await postcssCustomMediaResolver(modifiedRoot, result)
      }
      if (resolvedCustomSelectors) {
        const postcssCustomSelectorsResolver = createPostcssCustomSelectorsResolver({ preserve: false, importFrom })
        await postcssCustomSelectorsResolver(modifiedRoot, result)
      }
      if (resolvedCalc) {
        await postcssCalcResolver(modifiedRoot, result)
      }
      callPlugin(modifiedRoot)

      /*
        This implementation splits it for each plugin. This might be a performance problem. The easy
        solution would be to create a `kaliber/style-lint` plugin/rule. That rule would be the only
        rule that is configured in .stylelintrc. It would split the root once and then run the
        different rules manually (stylelint.rules['kaliber/xyz'](...)(splitRoot, result)).
      */
      if (normalizedCss)
        Object.entries(getNormalizedRoots(modifiedRoot)).forEach(([mediaQuery, modifiedRoot]) => {
          callPlugin(modifiedRoot)
        })

      function callPlugin(modifiedRoot) {
        plugin({ modifiedRoot, originalRoot, report, context })
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
    }
  }
}

function getId(node, message, index) {
  return `${getNodeId(node)}-${message}${index}`
}

function getNodeId({ type, prop, selector, name, params, parent }) {
  const nodeId =
    type === 'decl' ? `decl-${prop}` :
    type === 'rule' ? `rule-${selector}` :
    type === 'atrule' ? `atrule-${name}-${params}` :
    type

  const parentId = parent
    ? `${getNodeId(parent)}-`
    : ''

  return `${parentId}${nodeId}`
}
