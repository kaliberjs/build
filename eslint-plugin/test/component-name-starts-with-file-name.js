const { messages } = require('../')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `export function Test() {}` },
    { filename: 'Test.js', code: `function Something() {}` },
    { filename: 'Test.js', code: `export function something() {}` },
    { filename: 'App.js', code: `export default function App() {}` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `export function Something() {}`,
      errors: [{ message: messages['invalid component name']('TestSomething'), type: 'Identifier' }],
    },
    {
      filename: 'App.js',
      code: `export default function Something() {}`,
      errors: [{ message: messages['invalid component name']('App'), type: 'Identifier' }],
    },
  ]
}