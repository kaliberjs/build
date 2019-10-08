const { messages } = require('../')

module.exports = {
  valid: [
    `
      function Test() {
        return <div className={styles.component} />
      }
    `,
    `
      function Test2() {
        return (
          <div className={styles.component2}>
            <div className={styles.test} />
          </div>
        )
      }
    `,
    `
      function Test() {
        return (
          <div className={cx(styles.component, test && styles.test)} />
        )
      }
    `,
  ],
  invalid: [
    {
      code: `
        function Test() {
          return <div className={styles.test} />
        }
      `,
      errors: [{ message: messages['invalid className']('component'), type: 'Identifier' }],
    },
    {
      code: `
        function Test2() {
          return (
            <div className={styles.test}>
              <div className={styles.test2} />
            </div>
          )
        }
      `,
      errors: [{ message: messages['invalid className']('component2'), type: 'Identifier' }],
    },
  ]
}