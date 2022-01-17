const { RuleTester } = require('eslint')
const { rules } = require('..')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      generators: true,
      experimentalObjectRestSpread: true,
    }
  }
})

module.exports = {
  test,
  merge,
}

function test(ruleName, tests) {
  const rule = rules[ruleName]
  ruleTester.run(ruleName, rule, tests)
}

function merge(...tests) {
  return tests.reduce(
    (result, { valid, invalid }) => ({
      valid: result.valid.concat(valid),
      invalid: result.invalid.concat(invalid),
    }),
    { valid: [], invalid: [] }
  )
}
