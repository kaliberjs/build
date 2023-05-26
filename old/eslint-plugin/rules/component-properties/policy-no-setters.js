const { messages } = require('./')

module.exports = {
  valid: [
    `<div onChange={setState} />`,
    `<div onChange={() => setState(test1)} />`,
    `<div {...{ settings }} />`,
    `<div settings={test1} />`,
    `<div {...someProps} />`,
  ],
  invalid: [
    {
      code: `<div {...{ setState }} />`,
      errors: [ { message: messages['no setters']('setState'), type: 'JSXSpreadAttribute' }]
    },
    {
      code: `<div setState={test1} />`,
      errors: [ { message: messages['no setters']('setState'), type: 'JSXAttribute' }]
    },
  ],
}
