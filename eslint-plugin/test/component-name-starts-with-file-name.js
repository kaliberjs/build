const { messages } = require('../')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `export function Test() {}` },
    { filename: 'Test.js', code: `function Something() {}` },
    { filename: 'Test.js', code: `export function something() {}` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `export function Something() {}`,
      errors: [{ message: messages['invalid component name']('TestSomething'), type: 'Identifier' }],
    }
  ]
}