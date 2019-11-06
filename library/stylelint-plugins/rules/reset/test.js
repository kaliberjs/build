const { messages } = require('./')

module.exports = {
  'reset': {
    valid: [
      {
        title: 'valid - allow tag in reset.css',
        source: { filename: 'reset.css', source: `div { }` },
      },
      {
        title: 'valid - class selector not in index.css or reset.css',
        source: `.good { }`,
      },
    ],
    invalid: [
      {
        title: 'invalid - no class in reset.css',
        source: { filename: 'reset.css', source: `.bad { }` },
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: 'invalid - no class in reset.css',
        source: { filename: 'reset.css', source: `:global(.bad) { }` },
        warnings: [messages['no class selectors']('bad')]
      },
      {
        title: '└─ take @media into account',
        source: { filename: 'reset.css', source: `@media x { .bad { } }` },
        warnings: [messages['no class selectors']('bad')]
      },
    ]
  },
  'selector-policy': {
    valid: [
      {
        title: 'allow tag selectors in reset.css',
        source: { filename: 'reset.css', source: 'div { }' },
      },
    ],
    invalid: []
  },
  'layout-related-properties': {
    valid: [
      {
        title: 'allow some layout related props in root in reset.css',
        source: {
          filename: 'reset.css',
          source: `
            div {
              width: 100%; height: 100%;
              max-width: 100%; max-height: 100%;
              margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            }
          `,
        },
      },
    ],
    invalid: [
      {
        title: 'prevent other layout related props in root in reset.css',
        source: {
          filename: 'reset.css',
          source: `
            div {
              position: absolute;
              top: 0; right: 0; bottom: 0; left: 0;
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            }
          `,
        },
        warnings: 17
      },
    ]
  },
}
