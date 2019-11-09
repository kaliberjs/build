const assert = require('assert')
const stylelint = require('stylelint')

module.exports = { test }

function test(ruleName, tests) {
  Object.entries(tests).forEach(([ruleNameToTest, { valid, invalid }]) => {
    describe(ruleName === ruleNameToTest ? ruleName : `${ruleName} -> ${ruleNameToTest}`, () => {
      describe('valid', () => {
        valid.forEach(test => {
          it(test.title || test.code, async () => {
            await runTest(ruleNameToTest, test)
          })
        })
      })

      describe('invalid', () => {
        invalid.forEach(test => {
          it(test.title || test.code, async () => {
            await runTest(ruleNameToTest, test)
          })
        })
      })
    })
  })
}

async function runTest(ruleName, test) {
  const results = await stylelint.lint({
    code: test.code,
    codeFilename: test.filename,
    formatter: x => '', // When it fixes stuff, this function is not called (the new CSS is the output). If there are errors, the output contains the result of this function.
    config: {
      plugins: [require.resolve('../kaliber')],
      rules: {
        [`kaliber/${ruleName}`]: [true]
      }
    },
    fix: Boolean(test.output)
  })
  const warnings = results.results.reduce((array, result) => array.concat(result.warnings), [])

  if (typeof test.warnings === 'number') {
    assert.equal(warnings.length, test.warnings, `Expected ${test.warnings} warnings, received ${warnings.length} warnings`)
  } else {
    assert.deepEqual(warnings.map(x => x.text), test.warnings || [], 'warnings')
  }

  assert.equal(results.output, test.output || '')
}
