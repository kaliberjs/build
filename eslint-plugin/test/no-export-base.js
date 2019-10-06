const { messages } = require('../')

module.exports = {
  valid: [
    `export function Test() {}`,
    `export function testBase() {}`,
  ],
  invalid: [
    {
      code: `export function TestBase() {}`,
      errors: [{ message: messages['no export base'], type: 'ExportNamedDeclaration' }],
      output: `function TestBase() {}`
    },
  ]
}