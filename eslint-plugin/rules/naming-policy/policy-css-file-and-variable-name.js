const { messages } = require('.')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `import styles from './Test.css'` },
    { filename: 'Test.js', code: `import x from 'something'` },
    { filename: 'Test.js', code: `import abcStyles from './Other.css'` },
    { filename: 'Test.js', code: `import notStyles from './NotCss'` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `import styles from './Something.css'`,
      errors: [{ message: messages['invalid css file name']('./Something.css', './Test.css'), type: 'Literal' }]
    },
    {
      filename: 'Test.js',
      code: `import notStyles from './Test.css'`,
      errors: [{ message: messages['invalid styles variable name']('notStyles', 'styles'), type: 'Identifier' }]
    },
  ]
}
