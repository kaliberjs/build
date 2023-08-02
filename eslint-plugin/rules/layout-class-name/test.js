const { messages } = require('./')
const { test } = require('../../machinery/test')

test('layout-class-name', {
  valid: [
    `function Test({ layoutClassName }) { return <div className={layoutClassName} /> }`,
    `function Test({ layoutClassName }) { return <div className={cx(layoutClassName, styles.test)} /> }`,
    `
    function Test({ layoutClassName }) {
      return (
        <div className={cx(layoutClassName, styles.test)}>
          <div className={styles._root} />
        </div>
      )
    }
    `,
    `<div className='test' />`,
    `<div className={styles.test} />`,
    `<div {...{ className }} />`,
    `<Test layoutClassName={styles.testLayout} />`,
    `<Test layoutClassName='testLayout' />`,
    `<TestBase className='test' />`,
    `<TestBase className={styles.test} />`,
    `<TestBase {...{ className }} />`,
    `<FloatingOverlay className='test' />`,
    `<FloatingOverlay className={styles.test} />`,
    `<FloatingOverlay {...{ className }} />`,
    `<ReactSpring.animated.article className={styles.test} />`,
    `export function Test() {}`,
    `export function testBase() {}`,
    `function TestBase({ className }) { return <div {...{ className }} /> }`,
  ],
  invalid: [
    {
      code: `function Test({ layoutClassName }) { return <div><div className={layoutClassName} /></div> }`,
      errors: [{ message: messages['no layoutClassName in child'], type: 'Identifier' }]
    },
    {
      code: `function Test({ layoutClassName }) { return <div><div className={cx(layoutClassName, styles.test)} /></div> }`,
      errors: [{ message: messages['no layoutClassName in child'], type: 'Identifier' }]
    },
    {
      code: `function Test({ layoutClassName }) { return <div className={cx(layoutClassName, styles.component_root)} /> }`,
      errors: [{ message: messages['no _root with layoutClassName'], type: 'Identifier' }]
    },
    {
      code: `function Test({ layoutClassName }) { return <div className={cx(styles.component_root, layoutClassName)} /> }`,
      errors: [{ message: messages['no _root with layoutClassName'], type: 'Identifier' }]
    },
    {
      code: `function Test({ layoutClassName }) { return <div className={cx(layoutClassName, styles.component, styles._root)} /> }`,
      errors: [{ message: messages['no _root with layoutClassName'], type: 'Identifier' }]
    },
    {
      code: `<Test className='test' />`,
      errors: [{ message: messages['no className on custom component'], type: 'JSXAttribute' }]
    },
    {
      code: `<Test className={styles.test} />`,
      errors: [{ message: messages['no className on custom component'], type: 'JSXAttribute' }]
    },
    {
      code: `<Test {...{ className }} />`,
      errors: [{ message: messages['no className on custom component'], type: 'Property' }]
    },
    {
      code: `<Test layoutClassName={styles.test} />`,
      errors: [{ message: messages['invalid layoutClassName']('test', 'testLayout'), type: 'Identifier' }]
    },
    {
      code: `<Test layoutClassName={cx(styles.test, styles.testLayout)} />`,
      errors: [{ message: messages['invalid layoutClassName']('test', 'testLayout'), type: 'Identifier' }]
    },
    {
      code: `<Test layoutClassName='test' />`,
      errors: [{ message: messages['invalid layoutClassName']('test', 'testLayout'), type: 'Literal' }]
    },
    {
      code: `export function TestBase() {}`,
      errors: [{
        message: messages['no export base'],
        type: 'ExportNamedDeclaration',
        line: 1,
        endLine: 1,
        column: 1,
        endColumn: 8,
      }],
    },
  ]
})
