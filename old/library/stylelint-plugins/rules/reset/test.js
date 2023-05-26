const { messages } = require('./')
const { test } = require('../../machinery/test')

test('reset', {
  'reset': {
    valid: [
      {
        title: 'valid - allow tag in reset.css',
        filename: 'reset.css',
        code: `div { }`,
      },
      {
        title: 'valid - class selector not in index.css or reset.css',
        code: `.good { }`,
      },
    ],
    invalid: [
      {
        title: 'invalid - no class in reset.css',
        filename: 'reset.css',
        code: `.bad { }`,
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: 'invalid - no class in reset.css',
        filename: 'reset.css',
        code: `div, .bad { }`,
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: 'invalid - no class in reset.css',
        filename: 'reset.css',
        code: `:global(.bad) { }`,
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: '└─ take @media into account',
        filename: 'reset.css',
        code: `@media x { .bad { } }`,
        warnings: [messages['no class selectors']('bad')]
      },
    ]
  },
  'selector-policy': {
    valid: [
      {
        title: 'allow tag selectors in reset.css',
        filename: 'reset.css',
        code: 'div { }',
      },
    ],
    invalid: []
  },
  'layout-related-properties': {
    valid: [
      {
        title: 'allow some layout related props in root in reset.css',
        filename: 'reset.css',
        code: `
          div {
            width: 100%; height: 100%;
            max-width: 100%; max-height: 100%;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
          }
        `,
      },
    ],
    invalid: [
      {
        title: 'prevent other layout related props in root in reset.css',
        filename: 'reset.css',
        code: `
          div {
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
          }
        `,
        warnings: 17
      },
    ]
  },
  'at-rule-restrictions': {
    valid: [
      {
        title: 'allow @kaliber-scoped custom-element',
        filename: 'reset.css',
        code: `@kaliber-scoped custom-element;`
      },
    ],
    invalid: [
      {
        title: 'only allow @kaliber-scoped with custom-element',
        filename: 'reset.css',
        code: `@kaliber-scoped noCustomElement;`,
        warnings: [messages['only scope custom element']]
      },
    ]
  }
})
