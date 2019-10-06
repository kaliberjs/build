const { messages } = require('../')

module.exports = {
  valid: [
    `export function Test() {}`,
    `export function testBase() {}`,
  ],
  invalid: [
    {
      code: `export function TestBase() {}`,
      errors: [{
        message: messages['no export base'],
        type: 'ExportNamedDeclaration',
        line: 1,
        endLine: 1,
        column: 1,
        endColumn: 8,
      }],
      output: `function TestBase() {}`
    },
  ]
}