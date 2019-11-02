const { messages } = require('./')

module.exports = {
  valid: [
    `function Test() {}`,
    `function Test({ prop }) {}`,
    `function test(props) {}`,
  ],
  invalid: [
    {
      code: `function Test(props) {}`,
      errors: [ { message: messages['destructure props'], type: 'Identifier' }]
    },
  ],
}
