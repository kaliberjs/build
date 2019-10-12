const { messages } = require('..')

module.exports = {
  valid: [
    `<div test1={test2} />`,
    `<div {..{ test1 }} />`,
  ],
  invalid: [
    {
      code: `<div test1={test1} />`,
      errors: [ { message: messages['?'], type: 'Identifier' }]
    },
  ],
}
