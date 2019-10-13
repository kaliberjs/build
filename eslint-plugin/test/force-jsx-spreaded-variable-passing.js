const { messages } = require('..')

module.exports = {
  valid: [
    `<div test1={test2} />`,
    `<div {...{ test1 }} />`,
    `<div test='test' />`,
    `<div test />`,
  ],
  invalid: [
    {
      code: `<div test1={test1} />`,
      errors: [ { message: messages['incorrect variable passing']('test1'), type: 'JSXAttribute' }]
    },
  ],
}
