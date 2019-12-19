const { messages } = require('./')
const { test } = require('../../machinery/test')

test('index', {
  'index': {
    valid: [
      {
        title: 'valid - allow tag in index.css',
        filename: 'index.css',
        code: `div { }`,
      },
      {
        title: 'valid - allow global modifier class on body in index.css',
        filename: 'index.css',
        code: `:global(body.prevent-scroll) { overflow: hidden; }`,
      },
      {
        title: 'valid - allow global class in index.css',
        filename: 'index.css',
        code: `:global(.external-library) { color: 0; }`,
      },
      {
        title: 'valid - class selector not in index.css',
        code: `.good { }`,
      },
    ],
    invalid: [
      {
        title: 'invalid - no class in index.css',
        filename: 'index.css',
        code: `.bad { }`,
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: 'invalid - no class in index.css',
        filename: 'index.css',
        code: `div, .bad { }`,
        warnings: [messages['no class selectors']('bad')]
      },
    ]
  },
  'selector-policy': {
    valid: [
      {
        title: 'allow tag selectors in index.css',
        filename: 'index.css',
        code: 'div { }',
      },
    ],
    invalid: []
  },
  'at-rule-restrictions': {
    valid: [
      {
        title: 'allow font @import in index.css',
        filename: 'index.css',
        code: `@import url('https://fonts.googleapis.com/css');`
      },
      {
        title: 'allow custom element @kaliber-scoped in index.css',
        filename: 'index.css',
        code: `@kaliber-scoped custom-element;`
      },
    ],
    invalid: [
      {
        title: 'prevent non-font @import in index.css',
        filename: 'index.css',
        code: `@import 'x';`,
        warnings: [messages['only import font']]
      },
      {
        title: 'prevent non custom element @kaliber-scoped in index.css',
        filename: 'index.css',
        code: `@kaliber-scoped abc;`,
        warnings: [messages['only scope custom element']]
      },
    ]
  },
})
