const { messages } = require('../')

module.exports = {
  valid: [
    `styles.test`,
    `styles._root`,
    `styles._rootAbc`,
    `export function Test() { return <div className={styles.test} /> }`,
    `export function Test() { return <div className={cx(styles.test)} /> }`,
    `styles['metaGroup' + expertiseColumns]`,
  ],
  invalid: [
    {
      code: `styles._test`,
      errors: [{ message: messages['no styles with _'], type: 'Identifier' }]
    },
    {
      code: `export function Test() { return <div className={styles._test} /> }`,
      errors: [{ message: messages['no styles with _'], type: 'Identifier' }]
    },
    {
      code: `export function Test() { return <div className={cx(styles._test)} /> }`,
      errors: [{ message: messages['no styles with _'], type: 'Identifier' }]
    },
  ]
}