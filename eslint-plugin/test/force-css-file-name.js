const { messages } = require('../')

module.exports = {
  valid: [
    { filename: 'Test.js', code: `import styles from './Test.css'` },
    { filename: 'Test.js', code: `import x from 'something'` },
    { filename: 'Test.js', code: `import otherStyles from './Other.css'` },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `import styles from './Something.css'`,
      errors: [{ message: messages['invalid css file name']('./Something.css', './Test.css'), type: 'Literal' }]
    }
  ]
}