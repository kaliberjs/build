const { RuleTester } = require('eslint')
const { rules, messages } = require('..')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      generators: true,
      experimentalObjectRestSpread: true
    }
  }
})

test('root-component-class-name', {
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
})
test('child-no-component-class-name', {
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
})


function test(name, tests) {
  const rule = rules[name]
  ruleTester.run(name, rule, tests)
}
