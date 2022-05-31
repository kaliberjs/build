const { messages } = require('./')
const { test } = require('../../machinery/test')

function createMessages(key, values) { return values.map(messages[key]) }

test('layout-related-properties', {
  'layout-related-properties': {
    valid: [
      {
        title: `don't report errors when layout related props are used in child`,
        code: `
          .good {
            & > .test {
              width: 100%; height: 100%;
              position: absolute;
              top: 0; right: 0; bottom: 0; left: 0;
              margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
              justify-self: 0; align-self: 0;
              order: 0;
            }
          }
        `,
      },
      {
        title: 'allow `calc`',
        code: `
          :root {
            --container-max-width-md: 10px;
          }

          .good {
            @media (--viewport-md) {
              max-width: calc(var(--container-max-width-md) / 2) !important;
            }
          }`,
      },
      { code: '.good { width: 10px !important; height: 10px !important; }' },
      { code: '.good { min-width: 10px !important; min-height: 10px !important; }' },
      { code: '.good { max-width: 10px !important; max-height: 10px !important; }' },
      { code: '.good { width: 10em !important; height: 10em !important; }' },
      { code: '.good { width: 10rem !important; height: 10rem !important; }' },
      { code: '.good { position: relative; }' },
      { code: '.good { overflow: 0; }' },
      {
        title: 'take @value into account',
        code: `
          @value x: 10px;
          .good {
            width: x !important;
          }
        `,
      },
      {
        title: 'take custom properties into account',
        code: `
          :root {
            --x: 10px;
          }

          .good {
            width: var(--x) !important;
          }
        `,
      },
      { code: '.good { height: 0; padding-bottom: 65.25%; }' },
      { code: '.good { height: 0; padding-top: 65.25%; }' },
      { code: '.good { height: 0; padding-top: calc((9 / 16) * 100%); }' },
      { code: '.good { position: relative; & > .test { position: absolute; } }' },
      { code: '.good { &::before { position: absolute; } }' },
      { code: '.good { & > .test { width: 100%; } }' },
      { code: '.good { & > .test { position: relative; } }' },
      { code: '.good { & > .test { position: fixed; } }' },
      { code: '.good { padding: 100px; }' },
      { code: `.good { &::before { content: ''; color: back; } }` },
      { code: `.good { & > * { display: none; } }` },
      {
        title: 'take into account @supports',
        code: `
          .good {
            & > .test {
              @supports x {
                width: 0;
              }
            }
          }
        `
      },
    ],
    invalid: [
      {
        title: 'report error when using layout related props in root',
        code: `
          .bad {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
            order: 0;
            max-width: 0; min-width: 0; max-height: 0; min-height: 0;
          }
        `,
        warnings: createMessages('root - no layout related props', [
          'width', 'height',
          'position: absolute',
          'top', 'right', 'bottom', 'left',
          'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
          'justify-self', 'align-self',
          'order',
          'max-width', 'min-width', 'max-height', 'min-height',
        ])
      },
      {
        code: `.bad { position: fixed; }`,
        warnings: [messages['root - no layout related props']('position: fixed')]
      },
      {
        title: '└─ take @media into account',
        code: `
          .bad {
            @media x {
              width: 100%; height: 100%;
              position: absolute;
              top: 0; right: 0; bottom: 0; left: 0;
              margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
              justify-self: 0; align-self: 0;
              order: 0;
            }
          }
        `,
        warnings: createMessages('root - no layout related props', [
          'width', 'height',
          'position: absolute',
          'top', 'right', 'bottom', 'left',
          'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
          'justify-self', 'align-self',
          'order',
        ])
      },
      {
        title: 'report error when using intrinsic size without !important',
        code: '.bad { width: 10px; height: 10px; }',
        warnings: createMessages('root - no layout related props', ['width', 'height'])
      },
      {
        title: 'report error when using non intrinsic unit without !important',
        code: '.bad { width: 10% !important; height: 10% !important; }',
        warnings: createMessages('root - no layout related props', ['width', 'height'])
      },
      {
        code: '.good { height: 0; padding-bottom: 10px; }',
        warnings: [messages['root - no layout related props']('height')]
      },
      {
        code: '.bad { & > .test { padding: 100px; color: 0; } }',
        warnings: createMessages('nested - only layout related props in nested', [
          'padding', 'color'
        ])
      },
      {
        title: '└─ take @media into account',
        code: '.bad { & > .test { @media x { padding: 100px; } } }',
        warnings: createMessages('nested - only layout related props in nested', ['padding'])
      },
      {
        code: '.bad { & > .test { display: block; } }',
        warnings: [messages['nested - only layout related props in nested']('display')]
      },
      {
        code: '.bad { &::after, & > .test { display: block; } }',
        warnings: [messages['nested - only layout related props in nested']('display')]
      },
      {
        code: '.bad { &:not(.is-open) > .test { padding: 0; } }',
        warnings: [messages['nested - only layout related props in nested']('padding')]
      },
      {
        title: 'take into account @supports',
        code: `
          .bad {
            @supports x {
              height: 0;
            }
            & > .test {
              @supports x {
                color: 0;
              }
            }
          }
        `,
        warnings: [
          messages['root - no layout related props']('height'),
          messages['nested - only layout related props in nested']('color'),
        ]
      },
    ]
  }
})
