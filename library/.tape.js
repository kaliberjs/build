const { messages } = require('./stylelint-plugins/kaliber')
const stylelint = require('stylelint')

// patch in order to add support for filenames to tape
const originalLint = stylelint.lint.bind(stylelint)
stylelint.lint = function lint({ code, ...otherOptions }) {
  const options = (typeof code === 'object')
    ? { code: code.source, codeFilename: code.filename }
    : { code }
  return originalLint({ ...options, ...otherOptions })
}


function message(key) {
  const x = messages[key]
  return x || `programming error, message with key '${key}' not found`
}

function createMessages(key, values) {
  const x = messages[key]
  return values.map(x)
}

const tests = createTests()
const colorSchemeTests = require('./stylelint-plugins/rules/color-schemes/test')
const cssGlobalTests = require('./stylelint-plugins/rules/css-global/test')
const layoutRelatedPropertiesTests = require('./stylelint-plugins/rules/layout-related-properties/test')
const namingPolicyTests = require('./stylelint-plugins/rules/naming-policy/test')
const selectorPolicyTests = require('./stylelint-plugins/rules/selector-policy/test')
const parentChildPolicyTests = require('./stylelint-plugins/rules/parent-child-policy/test')
const rootPolicyTests = require('./stylelint-plugins/rules/root-policy/test')
const noImportTests = require('./stylelint-plugins/rules/no-import/test')
const resetTests = require('./stylelint-plugins/rules/reset/test')
const indexTests = require('./stylelint-plugins/rules/index/test')
const testEntries = [
  ...Object.entries(colorSchemeTests),
  ...Object.entries(cssGlobalTests),
  ...Object.entries(layoutRelatedPropertiesTests),
  ...Object.entries(namingPolicyTests),
  ...Object.entries(selectorPolicyTests),
  ...Object.entries(parentChildPolicyTests),
  ...Object.entries(rootPolicyTests),
  ...Object.entries(noImportTests),
  ...Object.entries(resetTests),
  ...Object.entries(indexTests),
]

const allTests = testEntries.reduce(
  (result, [rule, { valid, invalid }]) => ({
    ...result,
    [`kaliber/${rule}`]: (result[`kaliber/${rule}`] || [])
      .concat(valid.map(x => (!x.expect && (x.warnings = x.warnings || 0), x)))
      .concat(invalid)
  }),
  tests
)

module.exports = allTests

function createTests() {
  return {
    'kaliber/no-import': [
      {
        title: 'allow @import in *.entry.css',
        source: {
          filename: 'abc.entry.css',
          source: `@import 'x';`
        },
        warnings: 0
      },
    ],
  }
}
