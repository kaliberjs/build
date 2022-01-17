const { matchesFile } = require('../../machinery/filename')

const exclusiveToCssGlobal = {
  selectors: [':root'],
  atRules: ['custom-media', 'custom-selector'],
}

const allowedInCssGlobal = {
  selectors: [':export'],
  atRules: ['value'],
}

const messages = {
  'no': name =>
    `Unexpected ${name}\n` +
    `you can only use ${name} in the \`cssGlobal\` directory - ` +
    `move ${name} to to the \`cssGlobal\` directory`,
  'only': name =>
    `Unexpected ${name}\n` +
    `only @custom-selector, @custom-media, @value, :export and :root are allowed in the \`cssGlobal\` directory - ` +
    `move ${name} to \`reset.css\` or \`index.css\``,
}

module.exports = {
  ruleName: 'css-global',
  ruleInteraction: {
    'layout-related-properties': {
      childAllowDecl: decl => isCustomProperty(decl)
    },
  },
  cssRequirements: null,
  messages,
  create(config) {
    return ({ originalRoot, report }) => {
      checkAtRules({ originalRoot, report })
      checkRules({ originalRoot, report })
    }
  }
}

function isInCssGlobal(root) { return matchesFile(root, filename => filename.includes('/cssGlobal/')) }
function isCustomProperty({ prop }) { return prop.startsWith('--') }

function checkAtRules({ originalRoot, report }) {
  const inCssGlobal = isInCssGlobal(originalRoot)
  originalRoot.walkAtRules(rule => {
    const { name } = rule
    const exclusive = exclusiveToCssGlobal.atRules.includes(name)
    const allowed = exclusive || allowedInCssGlobal.atRules.includes(name)

    if (!inCssGlobal && exclusive) report(rule, messages['no'](`@${name}`))
    if (inCssGlobal && !allowed) report(rule, messages['only'](`@${name}`))
  })
}

function checkRules({ originalRoot, report }) {
  const inCssGlobal = isInCssGlobal(originalRoot)
  originalRoot.walkRules(rule => {
    const { selector } = rule
    const exclusive = exclusiveToCssGlobal.selectors.includes(selector)
    const allowed = exclusive || allowedInCssGlobal.selectors.includes(selector)

    if (!inCssGlobal && exclusive) report(rule, messages['no'](selector))
    if (inCssGlobal && !allowed) report(rule, messages['only'](selector))
  })
}
