const { messages } = require('../')

module.exports = {
  valid: [
    `import './test'`,
    `import x from '/test'`,
    `import x from './test'`,
    `export { x } from '/test'`,
    `export { x } from './test'`,
    `export * from '/test'`,
    `export * from './test'`,
  ],
  invalid: [
    `import '../test'`,
    `import x from '../test'`,
    `export { x } from '../test'`,
    `export * from '../test'`,
  ].map(code => ({ code, errors: [{ message: messages['no relative parent import'] }] }))
}