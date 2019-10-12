const { messages } = require('..')

module.exports = {
  valid: [
    `function Test() {}`,
    `function Test({ prop }) {}`,
  ],
  invalid: [
    {
      code: `function Test(props) {}`,
      errors: [ { message: messages['?'], type: 'Identifier' }]
    },
  ],
}
