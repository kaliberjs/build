const { messages } = require('../')

module.exports = {
  valid: [
    `
      function Test() {
        return <div className={styles.componentTest} />
      }
    `,
    `
      function Test2() {
        return (
          <div className={styles.componentTest2}>
            <div className={styles.test} />
          </div>
        )
      }
    `,
    `
      function Test() {
        return (
          <div className={cx(styles.componentTest, test && styles.test)} />
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
      errors: [{ message: messages['invalid className']('componentTest'), type: 'Identifier' }],
      output: `
        function Test() {
          return <div className={styles.componentTest} />
        }
      `,
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
      errors: [{ message: messages['invalid className']('componentTest2'), type: 'Identifier' }],
      output: `
        function Test2() {
          return (
            <div className={styles.componentTest2}>
              <div className={styles.test2} />
            </div>
          )
        }
      `,
    },
  ]
}