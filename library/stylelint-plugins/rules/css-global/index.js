const { matchesFile } = require('../../machinery/filename')

const allowedInCssGlobal = {
  selectors: [':root', ':export'],
  atRules: ['custom-media', 'custom-selector', 'value'],
}

const messages = {
  'no custom selector':
    `Unexpected @custom-selector\n` +
    `you can only use @custom-selector in the \`cssGlobal\` directory - ` +
    `move @custom-selector to the \`cssGlobal\` directory`,
  'only custom selector':
    `Unexpected at rule\n` +
    `only @custom-selector is allowed in the \`cssGlobal\` directory - ` +
    `move the at rule to \`reset.css\` or \`index.css\``,
  'no custom media':
    `Unexpected @custom-media\n` +
    `you can only use @custom-media in the \`cssGlobal\` directory - ` +
    `move @custom-media to the \`cssGlobal\` directory`,
  'only custom media':
    `Unexpected at rule\n` +
    `only @custom-media is allowed in the \`cssGlobal\` directory - ` +
    `move the at rule to \`reset.css\` or \`index.css\``,
  'no root selector':
    `Unexpected :root selector\n` +
    `you can only use the :root selector in the \`cssGlobal\` directory - ` +
    `move the :root selector and it's contents to the \`cssGlobal\` directory`,
  'only root selector':
    `Unexpected selector\n` +
    `only :root selectors are allowed in the \`cssGlobal\` directory - ` +
    `move the selector to \`reset.css\` or \`index.css\``,
}

module.exports = {
  ruleName: 'css-global',
  ruleInteraction: null,
  cssRequirements: null,
  messages,
  create(config) {
    return ({ root, report }) => {
      customSelectors({ root, report })
      customMedia({ root, report })
      customProperties({ root, report })
    }
  }
}

function isInCssGlobal(root) { return matchesFile(root, filename => filename.includes('/cssGlobal/')) }

function customSelectors({ root, report }) {
  root.walkAtRules(rule => {
    const { name } = rule
    if (name === 'custom-selector') {
      if (isInCssGlobal(root)) return
      report(rule, messages['no custom selector'])
    } else {
      if (!isInCssGlobal(root)) return
      if (allowedInCssGlobal.atRules.includes(name)) return
      report(rule, messages['only custom selector'])
    }
  })
}

function customMedia({ root, report }) {
  root.walkAtRules(rule => {
    const { name } = rule
    if (name === 'custom-media') {
      if (isInCssGlobal(root)) return
      report(rule, messages['no custom media'])
    } else {
      if (!isInCssGlobal(root)) return
      if (allowedInCssGlobal.atRules.includes(name)) return
      report(rule, messages['only custom media'])
    }
  })
}

function customProperties({ root, report }) {
  root.walkRules(rule => {
    const { selector } = rule
    if (selector === ':root') {
      if (isInCssGlobal(root)) return
      report(rule, messages['no root selector'])
    } else {
      if (!isInCssGlobal(root)) return
      if (allowedInCssGlobal.selectors.includes(selector)) return
      report(rule, messages['only root selector'])
    }
  })
}
