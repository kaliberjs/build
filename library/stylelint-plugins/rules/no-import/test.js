const { messages } = require('./')

module.exports = {
  'no-import': {
    valid: [
      { source: `.good { }` },
      {
        title: 'allow @import in *.entry.css',
        source: {
          filename: 'abc.entry.css',
          source: `@import 'x';`
        },
      },
    ],
    invalid: [
      {
        source: `@import 'x';`,
        warnings: [messages['no import']]
      },
    ]
  }
}
