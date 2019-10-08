const { messages } = require('../')

module.exports = {
  valid: [
    {
      filename: 'Test.js',
      code: `
        function Test() {
          return <div className={styles.component} />
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <div className={styles.component2}>
              <div className={styles.test} />
            </div>
          )
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function Test() {
          return (
            <div className={cx(styles.component, test && styles.test)} />
          )
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function TestTest() {
          return (
            <div className={styles.componentTest} />
          )
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function SomethingTest() {
          return (
            <div className={styles.componentSomethingTest} />
          )
        }
      `,
    }
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('component'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
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