const { messages } = require('../')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `import styles from './Test.css'` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `import notStyles from './Test.css'`,
      errors: [{ message: messages['invalid styles variable name']('notStyles', 'styles'), type: 'Identifier' }]
    },
  ]
}