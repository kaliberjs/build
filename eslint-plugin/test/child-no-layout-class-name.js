const { messages } = require('../')

module.exports = {
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
  ]
}
