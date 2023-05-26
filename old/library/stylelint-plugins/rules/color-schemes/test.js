const { messages } = require('./')
const { test } = require('../../machinery/test')

function createMessages(key, values) { return values.map(messages[key]) }

test('color-schemes', {
  'color-schemes': {
    valid: [
      {
        title: 'allow color related properties in color scheme css files',
        filename: 'colorScheme/abc.css',
        code: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
      },
      {
        title: 'allow non color related properties non color scheme css files',
        filename: 'notColorScheme/abc.css',
        code: '.good { padding: 0; }'
      },
    ],
    invalid: [
      {
        title: 'only allow color related properties in color scheme css files',
        filename: 'colorScheme/abc.css',
        code: '.bad { padding: 0; & .test { margin: 0; } }',
        warnings: createMessages('only color related properties', [
          'padding', 'margin'
        ])
      },
    ],
  },
  'layout-related-properties': {
    valid: [
      {
        title: 'allow color related properties in color scheme css files',
        filename: 'colorScheme/abc.css',
        code: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
      },
    ],
    invalid: [],
  },
  'selector-policy': {
    valid: [
      {
        title: 'allow double child selectors in color schemes',
        filename: 'colorScheme.css',
        code: '.good { & ::selection { } }'
      },
      {
        title: 'allow non direct child selector in color scheme',
        filename: 'colorScheme/abc.css',
        code: '.good { & .test { } }'
      },
    ],
    invalid: [],
  },
})
