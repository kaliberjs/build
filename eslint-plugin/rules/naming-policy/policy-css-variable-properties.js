const { messages } = require('./')

module.exports = {
  valid: [
    `styles.test`,
    `styles._root`,
    `styles._rootAbc`,
    {
      filename: 'Test.js',
      code: `export function Test() { return <div className={styles.component} /> }`,
    },
    {
      filename: 'Test.js',
      code: `export function Test() { return <div className={cx(styles.component, styles.test)} /> }`,
    },
    `styles['metaGroup' + expertiseColumns]`,
    'styles[`metaGroup${expertiseColumns}`]',
  ],
  invalid: [
    {
      code: `styles._test`,
      errors: [{ message: messages['no styles properties with _']('_test'), type: 'Identifier' }]
    },
    {
      code: `styles['_test' + index]`,
      errors: [{ message: messages['no styles properties with _']('_test'), type: 'BinaryExpression' }]
    },
    {
      code: 'styles[`_test${index}`]',
      errors: [{ message: messages['no styles properties with _']('_test'), type: 'TemplateLiteral' }]
    },
    {
      filename: 'Test.js',
      code: `export function Test() { return <div className={cx(styles.component, styles._test)} /> }`,
      errors: [{ message: messages['no styles properties with _']('_test'), type: 'Identifier' }]
    },
  ]
}
