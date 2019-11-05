const { matchesFile } = require('../../machinery/filename')

const messages = {
  'no import':
    `Unexpected @import\n` +
    `you can only use @import in \`*.entry.css\` files or in \`index.css\` files - ` +
    `you might not need the import, for custom variables, custom media and custom selectors you can place the code in \`src/cssGlobal/\`\n` +
    `in other cases try another method of reuse, for example create another class`,
}

module.exports = {
  ruleName: 'no-import',
  ruleInteraction: null,
  cssRequirements: {
    // resolvedCustomProperties: true, TODO: add test case
    // resolvedModuleValues: true, TODO: add test case
  },
  messages,
  create({ allowSpecificImport }) {
    const allowImport = isEntryCss

    return ({ originalRoot, modifiedRoot, report, context }) => {
      noImport({ root: modifiedRoot, report, allowImport, allowSpecificImport })
    }
  }
}

function noImport({ root, report, allowImport, allowSpecificImport }) {
  if (allowImport && allowImport(root)) return
  root.walkAtRules(rule => {
    if (rule.name !== 'import') return
    const specific = allowSpecificImport && allowSpecificImport(rule)
    if (specific) {
      if (typeof specific !== 'string') return
      report(rule, specific)
    } else {
      report(rule, messages['no import'])
    }
  })
}

function isEntryCss(root) { return matchesFile(root, filename => filename.endsWith('.entry.css')) }
