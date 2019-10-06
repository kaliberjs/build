const { messages } = require('../')

module.exports = {
  valid: [
    `
      function Test() {
        return (
          <div className={styles.componentTest}>
            <div className={styles.test} />
          </div>
        )
      }
    `,
  ],
  invalid: [
    {
      code: `
        function Test2() {
          return (
            <div className={styles.componentTest2}>
              <div className={styles.componentX} />
            </div>
          )
        }
      `,
      errors: [ { message: messages['no component className'], type: 'Identifier' }]
    }
  ],
}
