const { matchesFile } = require('../../machinery/filename')

const allowedInCssGlobal = {
  selectors: [':root', ':export'],
  atRules: ['custom-media', 'custom-selector', 'value'],
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
  ruleInteraction: null,
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

function checkAtRules({ originalRoot, report }) {
  const inCssGlobal = isInCssGlobal(originalRoot)
  originalRoot.walkAtRules(rule => {
    const { name } = rule
    const allowed = allowedInCssGlobal.atRules.includes(name)

    if (!inCssGlobal && allowed) report(rule, messages['no'](`@${name}`))
    if (inCssGlobal && !allowed) report(rule, messages['only'](`@${name}`))
  })
}

function checkRules({ originalRoot, report }) {
  const inCssGlobal = isInCssGlobal(originalRoot)
  originalRoot.walkRules(rule => {
    const { selector } = rule
    const allowed = allowedInCssGlobal.selectors.includes(selector)

    if (!inCssGlobal && allowed) report(rule, messages['no'](selector))
    if (inCssGlobal && !allowed) report(rule, messages['only'](selector))
  })
}
