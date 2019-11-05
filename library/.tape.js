const stylelint = require('stylelint')

// patch in order to add support for filenames to tape
const originalLint = stylelint.lint.bind(stylelint)
stylelint.lint = function lint({ code, ...otherOptions }) {
  const options = (typeof code === 'object')
    ? { code: code.source, codeFilename: code.filename }
    : { code }
  return originalLint({ ...options, ...otherOptions })
}

module.exports = [
  require('./stylelint-plugins/rules/color-schemes/test'),
  require('./stylelint-plugins/rules/css-global/test'),
  require('./stylelint-plugins/rules/layout-related-properties/test'),
  require('./stylelint-plugins/rules/naming-policy/test'),
  require('./stylelint-plugins/rules/selector-policy/test'),
  require('./stylelint-plugins/rules/parent-child-policy/test'),
  require('./stylelint-plugins/rules/root-policy/test'),
  require('./stylelint-plugins/rules/no-import/test'),
  require('./stylelint-plugins/rules/reset/test'),
  require('./stylelint-plugins/rules/index/test'),
].reduce(
  (result, ruleTests) =>
    Object.entries(ruleTests).reduce(
      (result, [ruleName, { valid, invalid }]) => {
        const previous = result[`kaliber/${ruleName}`] || []

        return {
          ...result,
          [`kaliber/${ruleName}`]: previous
            // @ts-ignore - https://stackoverflow.com/questions/49510832/typescript-how-to-map-over-union-array-type
            .concat(valid.map(x => x.expect ? x : { ...x, warnings: x.warnings || 0 }))
            .concat(invalid)
        }
      },
      result
    ),
  {}
)
