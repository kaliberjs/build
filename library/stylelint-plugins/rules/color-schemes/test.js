const { messages } = require('./')

function createMessages(key, values) { return values.map(messages[key]) }

module.exports = {
  'color-schemes': {
    valid: [
      {
        title: 'allow color related properties in color scheme css files',
        source: {
          filename: 'colorScheme/abc.css',
          source: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
        },
      },
      {
        title: 'allow non color related properties non color scheme css files',
        source: {
          filename: 'notColorScheme/abc.css',
          source: '.good { padding: 0; }'
        },
      },
    ],
    invalid: [
      {
        title: 'only allow color related properties in color scheme css files',
        source: {
          filename: 'colorScheme/abc.css',
          source: '.bad { padding: 0; & .test { margin: 0; } }'
        },
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
        source: {
          filename: 'colorScheme/abc.css',
          source: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
        },
      },
    ],
    invalid: [],
  },
  'selector-policy': {
    valid: [
      {
        title: 'allow double child selectors in color schemes',
        source: {
          filename: 'colorScheme.css',
          source: '.good { & ::selection { } }'
        },
      },
      {
        title: 'allow non direct child selector in color scheme',
        source: {
          filename: 'colorScheme/abc.css',
          source: '.good { & .test { } }'
        },
      },
    ],
    invalid: [],
  },
}
