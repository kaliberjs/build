const { messages } = require('.')

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
        function Test() {
          return <div className={cx(styles.component, styles.test)} />
        }
      `,
    },
    {
      filename: 'NotTest.js',
      code: `
        function Test() {
          return (
            <div className={styles.componentTest}>
              <div className={styles.test} />
            </div>
          )
        }
      `
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
            <div>
              <div className={styles.test1} />
              <div className={styles.test2} />
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
    `
      function Test() {
        return (
          <div {...{ test }} className={styles.componentTest}>
            <div className={styles.test} />
          </div>
        )
      }
    `,
    `
      function Test() {
        return (
          <div className={styles.componentTest}>
            <div className={styles[\`test\`]} />
          </div>
        )
      }
    `,
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
      export default function App() {
          return (
            <div className={styles.app} />
          )
        }
      `,
    },
    {
      filename: 'TestApp.js',
      code: `
        export default function TestApp() {
          return (
            <div className={styles.app} />
          )
        }
      `,
    },
    {
      filename: 'TestApp.js',
      code: `
        export function TestApp() {
          return (
            <div className={styles.app} />
          )
        }
      `,
    },
    {
      filename: 'App.js',
      code: `
        function Input() {
          return (
            <div className={styles.componentInput} />
          )
        }
      `,
    },
    {
      filename: 'src/pages/Something.js',
      code: `
        export function Something() {
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
    },
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <Test2 component={<div className={styles.test} />} />
      }
      `,
    },
  ],
  invalid: [
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('test', 'component'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <div className={styles.test, styles.component} />
      }
      `,
      errors: [
        { message: messages['invalid className']('test', 'component'), type: 'Identifier' },
      ],
    },
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <div className={styles.test, styles.componentTest} />
      }
      `,
      errors: [
        { message: messages['invalid className']('test', 'component'), type: 'Identifier' },
        { message: messages['invalid className']('componentTest', 'component'), type: 'Identifier' },
      ],
    },
    {
      filename: 'Test.js',
      code: `
      function Test() {
        return <div className={styles.component, styles.componentTest} />
      }
      `,
      errors: [
        { message: messages['invalid className']('componentTest', 'component'), type: 'Identifier' },
      ],
    },
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
      errors: [{ message: messages['no root className']('componentX'), type: 'Identifier' }]
    },
    {
      filename: 'Test.js',
      code: `
      class Test {
        render() {
          return <div className={styles.test} />
        }
      }
      `,
      errors: [{ message: messages['invalid className']('test', 'component???'), type: 'Identifier'}]
    },
    {
      filename: 'App.js',
      code: `
      export function App() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('test', 'app'), type: 'Identifier' }],
    },
    {
      filename: 'App.js',
      code: `
      function Input() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('test', 'componentInput'), type: 'Identifier' }],
    },
    {
      filename: 'src/pages/Something.js',
      code: `
      export function Something() {
        return <div className={styles.test} />
      }
      `,
      errors: [{ message: messages['invalid className']('test', 'page'), type: 'Identifier' }],
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
      errors: [{ message: messages['invalid className']('test', 'component2'), type: 'Identifier' }],
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
      errors: [{ message: messages['invalid className']('test', 'component2'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test() {
          return (
            <Wrapper>
              <div className={styles.component} />
              <div className={styles.component} />
            </Wrapper>
          )
        }
      `,
      errors: Array(2).fill({ message: messages['no root className']('component'), type: 'Identifier' }),
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <Wrapper>
              <div className={styles.component2} />
              <div className={styles.component2} />
            </Wrapper>
          )
        }
      `,
      errors: Array(2).fill({ message: messages['no root className']('component2'), type: 'Identifier' }),
    },
    {
      filename: 'Test.js',
      code: `
        function TestAbc() {
          return (
            <Wrapper>
              <div className={styles.componentAbc} />
              <div />
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['no root className']('componentAbc'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <Wrapper>
              <div />
              <div>
                <div className={styles.component2} />
              </div>
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['no root className']('component2'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <>
              <div />
              <div className={styles.component2} />
            </>
          )
        }
      `,
      errors: [{ message: messages['no root className']('component2'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          return (
            <>
              <div className={styles.component2} />
              <div />
            </>
          )
        }
      `,
      errors: [{ message: messages['no root className']('component2'), type: 'Identifier' }],
    },
    {
      filename: 'Test.js',
      code: `
        function Test2() {
          const x = ['a', 'b']
          return (
            <Wrapper>
              {x.map(x => <div key={x} className={styles.component2} />)}
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['no root className']('component2'), type: 'Identifier' }],
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
      errors: [{ message: messages['invalid className']('component_rootTest2', 'component_root2'), type: 'Identifier' }],
    },
    {
      filename: 'Menu.js',
      code: `
        export function Menu({ layoutClassName }) {
          return (
            <Wrapper>
              {style.map(({ item, key, props: { transform, opacity } }) =>
                item && (
                  <ReactSpring.animated.div
                    className={cx(styles.component_root, layoutClassName)}
                    style={{ transform }}
                    {...{ key }}
                  />
                )
              )}
            </Wrapper>
          )
        }
      `,
      errors: [{ message: messages['no root className']('component_root'), type: 'Identifier' }],
    }
  ]
}
