const { messages } = require('../')

module.exports = {
  valid: [
    `<div className='test' />`,
    `<div className={styles.test} />`,
    `<div {...{ className }} />`,
    `<TestBase className='test' />`,
    `<TestBase className={styles.test} />`,
    `<TestBase {...{ className }} />`,
    `<ReactSpring.animated.article className={styles.test} />`
  ],
  invalid: [
    {
      code: `<Test className='test' />`,
      errors: [{ message: messages['no className on custom component'], type: 'JSXAttribute' }]
    },
    {
      code: `<Test className={styles.test} />`,
      errors: [{ message: messages['no className on custom component'], type: 'JSXAttribute' }]
    },
    {
      code: `<Test {...{ className }} />`,
      errors: [{ message: messages['no className on custom component'], type: 'Property' }]
    }
  ]
}