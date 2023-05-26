const { messages } = require('.')
const { test } = require('../../machinery/test')

test('at-rule-restrictions', {
  'at-rule-restrictions': {
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
      {
        code: `@kaliber-scoped abc;`,
        warnings: [messages['no kaliber-scoped']]
      },
    ]
  }
})
