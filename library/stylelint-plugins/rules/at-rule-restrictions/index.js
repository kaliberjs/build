const { matchesFile } = require('../../machinery/filename')

const messages = {
  'no import':
    `Unexpected @import\n` +
    `you can only use @import in \`*.entry.css\` files or in \`index.css\` files - ` +
    `you might not need the import, for custom variables, custom media and custom selectors you can place the code in \`src/cssGlobal/\`\n` +
    `in other cases try another method of reuse, for example create another class`,
  'no kaliber-scoped':
    `Unexpected @kaliber-scoped\n` +
    `you can only use @kaliber-scoped in locations that have been whitelisted by other rules.`
}

module.exports = {
  ruleName: 'at-rule-restrictions',
  ruleInteraction: null,
  cssRequirements: {
    // resolvedCustomProperties: true, TODO: add test case
    // resolvedModuleValues: true, TODO: add test case
  },
  messages,
  create({ allowSpecificImport, allowSpecificKaliberScoped }) {
    const allowImport = isEntryCss

    return ({ originalRoot, modifiedRoot, report, context }) => {
      noImport({ root: modifiedRoot, report, allowImport, allowSpecificImport })
      noKaliberScoped({ root: modifiedRoot, report, allowSpecificKaliberScoped })
    }
  }
}

function noImport({ root, report, allowImport, allowSpecificImport }) {
  if (allowImport && allowImport(root)) return
  root.walkAtRules('import', rule => {
    const specific = allowSpecificImport && allowSpecificImport(rule)
    if (specific) {
      if (typeof specific !== 'string') return
      report(rule, specific)
    } else {
      report(rule, messages['no import'])
    }
  })
}

function noKaliberScoped({ root, report, allowSpecificKaliberScoped }) {
  root.walkAtRules('kaliber-scoped', rule => {
    const specific = allowSpecificKaliberScoped && allowSpecificKaliberScoped(rule)
    if (specific) {
      if (typeof specific !== 'string') return
      report(rule, specific)
    } else {
      report(rule, messages['no kaliber-scoped'])
    }
  })
}

function isEntryCss(root) { return matchesFile(root, filename => filename.endsWith('.entry.css')) }
