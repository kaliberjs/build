const { messages } = require('./')

module.exports = {
  'no-import': {
    valid: [
      { source: `.good { }` }
    ],
    invalid: [
      {
        source: `@import 'x';`,
        warnings: [messages['no import']]
      },
    ]
  }
}
