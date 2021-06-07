const { messages } = require('./')

module.exports = {
  valid: [
    `<div className={cx(fullscreen && styles.component)} />`,
    `<div className={styles.component} />`,
    `<div className="MenuItem" />`
  ],
  invalid: [
    {
      code: `<div className={fullscreen && styles.component} />`,
      errors: [{ message: messages['incorrect logical expression in className'], type: 'JSXIdentifier' }]
    },
  ],
}
