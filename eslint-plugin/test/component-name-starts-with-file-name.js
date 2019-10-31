const { messages } = require('../')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `export function Test() {}` },
    { filename: 'Test.js', code: `function Something() {}` },
    { filename: 'Test.js', code: `export function something() {}` },
    { filename: 'App.js', code: `export default function App() {}` },
    { filename: 'index.html.js', code: `export default function Index() {}` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `export function Something() {}`,
      errors: [{ message: messages['invalid component name']('Something', 'TestSomething'), type: 'Identifier' }],
    },
    {
      filename: 'App.js',
      code: `export default function Something() {}`,
      errors: [{ message: messages['invalid component name']('Something', 'App'), type: 'Identifier' }],
    },
  ]
}