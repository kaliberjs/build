const { messages } = require('../')

module.exports = {
  valid: [
    `function Test({ layoutClassName }) { return <div className={layoutClassName} /> }`,
    `function Test({ layoutClassName }) { return <div className={cx(layoutClassName, styles.test)} /> }`,
  ],
  invalid: [
    {
      code: `function Test({ layoutClassName }) { return <div><div className={layoutClassName} /></div> }`,
      errors: [{ message: messages['no layoutClassName'], type: 'Identifier' }]
    },
    {
      code: `function Test({ layoutClassName }) { return <div><div className={cx(layoutClassName, styles.test)} /></div> }`,
      errors: [{ message: messages['no layoutClassName'], type: 'Identifier' }]
    },
  ]
}
