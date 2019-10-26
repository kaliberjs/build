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
        function Test2() {
          return (
            <div {...{ test }} className={styles.component2}>
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
      filename: 'App.js',
      code: `
        function App() {
          return (
            <div className={styles.app} />
          )
        }
      `,
    },
    {
      filename: 'src/pages/MyPage.js',
      code: `
        function MyPage() {
          return (
            <div className={styles.page} />
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
    },
    {
      filename: 'Test.js',
      code: `
        function SomethingTest() {
          return (
            <div className={styles.component_rootSomethingTest} />
          )
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function Test() {
          return (
            <Wrapper>
              <div className={styles.component} />
            </Wrapper>
          )
        }
      `,
    },
    {
      filename: 'Test.js',
      code: `
        function Test() {
          return (
            <Wrapper>
              <div className={styles.component_root} />
            </Wrapper>
          )
        }
      `,
    },
    {
      filename: 'Menu.js',
      code: `
        export function Menu({ layoutClassName }) {
          return (
            style.map(({ item, key, props: { transform, opacity } }) =>
              item && (
                <ReactSpring.animated.div
                  className={cx(styles.component_root, layoutClassName)}
                  style={{ transform }}
                  {...{ key }}
                />
              )
            )
          )
        }
      `
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
      filename: 'App.js',
      code: `
      function App() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('app'), type: 'Identifier' }],
    },
    {
      filename: 'src/pages/MyPage.js',
      code: `
      function MyPage() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('page'), type: 'Identifier' }],
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
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <Wrapper>
              <div className={styles.test} />
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['invalid className']('component2'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <Wrapper>
              <div className={styles.component_rootTest2} />
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['invalid className']('component_root2'), type: 'Identifier' }],
    },
  ]
}