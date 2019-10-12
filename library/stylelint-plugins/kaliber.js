const stylelint = require('stylelint')
const createSelectorParser = require('postcss-selector-parser')
const createValueParser = require('postcss-values-parser')
const selectorParser = createSelectorParser()
const path = require('path')

function parseValue(value) { return createValueParser(value).parse() }

const allowedInReset = [
  'width', 'height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
]

const flexChildProps = [
  'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'order',
]

const layoutRelatedProps = [
  'width', 'height',
  ['position', 'absolute'],
  'top', 'right', 'bottom', 'left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  ...flexChildProps,
]
const layoutRelatedPropsWithValues = extractPropsWithValues(layoutRelatedProps)

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
  validStackingContextInRoot(),
  noLayoutRelatedPropsInRoot(),
  noDoubleNesting(),
  absoluteHasRelativeParent(),
  onlyLayoutRelatedPropsInNested(),
  noComponentNameInNested(),
  noChildSelectorsInRoot(),
  noDoubleChildSelectorsInNested(),
  noTagSelectors(),
  onlyDirectChildSelectors(),
  requireDisplayFlexInParent(),
  noChildElementSelectorsInMedia(),
  onlyTagSelectorsInResetAndIndex(),
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
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const decl = findDecl(rule, 'position')
        if (!decl || decl.value !== 'absolute') return

        const parentDecl = findDecl(parent, 'position')
        if (!parentDecl || parentDecl.value !== 'relative')
          report(decl, messages['nested - absolute has relative parent'])
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
        if (!getParentRule(parent) || !hasChildSelector(rule)) return
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
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {

        const decl = findDecl(rule, 'z-index')
        if (!decl) return

        if (missingProps(parent, { 'z-index': '0', 'position': 'relative' }))
          report(decl, messages['nested - missing stacking context in parent'])
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
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {

        const decl = findDecl(rule, 'z-index')
        if (!decl) return

        if (missingProps(rule, { 'position': 'relative' }))
          report(decl, messages['root - z-index without position relative'])

        if (decl.value !== '0')
          report(decl, messages['root - z-index not 0'])
      })
    },
  })
}

function noLayoutRelatedPropsInRoot() {
  const intrinsicUnits = ['px', 'em', 'rem', 'vw', 'vh']
  const intrinsicProps = ['width', 'height']
  const messages = {
    'root - no layout related props': prop =>
      `illegal layout related prop\n` +
      `\`${prop}\` can only be used by root rules in nested selectors - ` +
      `move to a nested selector in a another root rule` + (
        intrinsicProps.includes(prop)
        ? `\nif you are trying to define an intrinsic ${prop}, make sure you set the unit to ` +
          `one of \`${intrinsicUnits.join('`, `')}\` and add \`!important\``
        : ''
      )
  }
  return createPlugin({
    ruleName: 'kaliber/no-layout-related-props-in-root',
    messages,
    plugin: ({ root, report }) => {
      withRootRules(root, rule => {

        const decls = findDecls(rule, layoutRelatedProps)
        decls.forEach(decl => {
          const { prop } = decl
          if (intrinsicProps.includes(prop) && isIntrinsicValue(decl)) return
          if (isReset(root) && allowedInReset.includes(prop)) return
          const value = layoutRelatedPropsWithValues[prop]
          report(decl, messages['root - no layout related props'](prop + (value ? `: ${value}` : '')))
        })
      })
    }
  })

  function isIntrinsicValue({ important, value }) {
    const [number] = parseValue(value).first.nodes.filter(x => x.type === 'number')
    return important && number && intrinsicUnits.includes(number.unit)
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

function noChildSelectorsInRoot() {
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
    plugin: ({ root, report }) => {
      withNestedRules(root, (rule, parent) => {
        const decls = findDecls(rule, flexChildProps)
        if (!decls.length) return

        if (missingProps(parent, { 'display': 'flex' }))
          decls.forEach(decl => {
            report(decl, messages['nested - require display flex in parent'](decl.prop))
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
        const [prop, value] = x
        return { ...result, [prop]: value }
      } else return result
    },
    {}
  )
}

function withNestedRules(root, f) {
  root.walkRules(rule => {
    const parent = getParentRule(rule)
    if (!parent) return
    f(rule, parent)
  })
}

function withRootRules(root, f) {
  root.walkRules(rule => {
    const parent = getParentRule(rule)
    if (parent) return
    f(rule)
  })
}

function findDecls(rule, targets, { onlyInvalidTargets = false } = {}) {
  let result = []
  const normalizedTargets = targets.reduce(
    (result, x) => {
      const [name, value] = Array.isArray(x) ? x : [x, '']
      return { ...result, [name]: value }
    },
    {}
  )

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

function invalidTarget(targets, { prop, value }) {
  const hasProp = targets.hasOwnProperty(prop)
  const targetValue = targets[prop]
  return !hasProp || (targetValue && targetValue !== value)
}

function findDecl(rule, name) {
  const [result] = findDecls(rule, [name])
  return result
}

function missingProps(target, requiredProps) {
  const actualProps = getProps(target)
  return Object.entries(requiredProps).reduce(
    (invalid, [prop, value]) => invalid || actualProps[prop] !== value,
    false
  )
}

function createPlugin({ ruleName, messages, plugin }) {
  const stylelintPlugin = stylelint.createPlugin(ruleName, pluginWrapper)

  return {
    ...stylelintPlugin,
    rawMessages: messages,
    messages: stylelint.utils.ruleMessages(ruleName, messages),
    ruleName
  }

  function pluginWrapper(primaryOption, secondaryOptionObject) {
    return (root, result) => {
      const check = { actual: primaryOption, possible: [true] }
      if (!stylelint.utils.validateOptions(result, ruleName, check)) return

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
      const reported = {}

      plugin({ root, report })
      Object.entries(splitByMediaQueries(root)).forEach(([mediaQuery, root]) => {
        plugin({ root, report })
      })

      function report(node, message, index) {
        const id = getId(node, message, index)
        if (reported[id]) return
        else reported[id] = true
        stylelint.utils.report({ message, index, node, result, ruleName })
      }

      function getId({ type, prop, selector, params }, message, index) {
        const nodeId =
          type === 'decl' ? `decl-${prop}` :
          type === 'rule' ? `rule-${selector}` :
          type === 'atrule' ? `atrule-${params}` :
          type

        return `${nodeId}-${message}${index}`
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
