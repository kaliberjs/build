const { messages } = require('./')
const { test } = require('../../machinery/test')

test('no-import', {
  'no-import': {
    valid: [
      { code: `.good { }` },
      {
        title: 'allow @import in *.entry.css',
        filename: 'abc.entry.css',
        code: `@import 'x';`
      },
    ],
    invalid: [
      {
        code: `@import 'x';`,
        warnings: [messages['no import']]
      },
    ]
  }
})
