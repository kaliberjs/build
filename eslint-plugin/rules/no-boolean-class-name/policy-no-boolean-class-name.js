const { messages } = require('./')

module.exports = {
  valid: [
    `<div className={cx(fullscreen && styles.component)} />`,
    `<Card className={cx(fullscreen && styles.component)} />`,
    `<div className={styles.component} />`,
    `<div className="MenuItem" />`,
    `<div id={item && item.id} />`,
    `<Card id={item && item.id} {...{ item }} key={item.id} />`,
    `<div className={value ? styles[value] : styles.default} />`
  ],
  invalid: [
    {
      code: `<div className={fullscreen && styles.component} />`,
      errors: [{ message: messages['incorrect logical expression in className'], type: 'JSXIdentifier' }]
    },
  ],
}
