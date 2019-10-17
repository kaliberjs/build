const { messages } = require('../')

module.exports = {
  valid: [
    `export function Test() {}`,
    {
      filename: 'App.js',
      code: `export default function App() {}`
    },
    {
      filename: 'TestApp.js',
      code: `export default function App() {}`
    },
    {
      filename: 'index.html.js',
      code: `export default function index() {}`
    },
    {
      filename: 'template.mjml.js',
      code: `export default function template() {}`
    },
    {
      filename: 'component.php.js',
      code: `export default function component() {}`
    },
  ],
  invalid: [
    {
      code: `export default function Test() {}`,
      errors: [{ message: 'Prefer named exports.' }]
    },
  ]
}