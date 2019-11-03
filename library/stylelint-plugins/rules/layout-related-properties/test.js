const { messages } = require('./')

function createMessages(key, values) { return values.map(messages[key]) }

module.exports = {
  'layout-related-properties': {
    valid: [
      {
        title: `don't report errors when layout related props are used in child`,
        source: `
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
            }
          }
        `,
      },
      {
        title: `don't report errors when layout related props are used in _root or component_root`,
        source: `
          ._rootTest {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
          }

          .component_rootTest {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
          }
        `,
      },
      {
        title: 'allow `calc`',
        source: `
          :root {
            --container-md: 10px;
          }

          .good {
            @media (--viewport-md) {
              max-width: calc(var(--container-md) / 2) !important;
            }
          }`,
      },
      { source: '.good { width: 10px !important; height: 10px !important; }' },
      { source: '.good { min-width: 10px !important; min-height: 10px !important; }' },
      { source: '.good { max-width: 10px !important; max-height: 10px !important; }' },
      { source: '.good { width: 10em !important; height: 10em !important; }' },
      { source: '.good { width: 10rem !important; height: 10rem !important; }' },
      { source: '.good { position: relative; }' },
      { source: '.good { overflow: 0; }' },
      { source: '.good { pointer-events: none; }' },
      { source: '.good { display: none; }' },
      {
        title: 'take @value into account',
        source: `
          @value x: 10px;
          .good {
            width: x !important;
          }
        `,
      },
      {
        title: 'take custom properties into account',
        source: `
          :root {
            --x: 10px;
          }

          .good {
            width: var(--x) !important;
          }
        `,
      },
      { source: '.good { height: 0; padding-bottom: 65.25%; }' },
      { source: '.good { height: 0; padding-top: 65.25%; }' },
      { source: '.good { z-index: 0; position: relative; }' },
      { source: '.good { position: relative; & > .test { position: absolute; } }' },
      { source: '.good { position: relative; z-index: 0; & > .test { position: absolute; z-index: 1; } }' },
      { source: '.good { &::before { position: absolute; } }' },


      { source: '.good { & > .test { width: 100%; } }', warnings: 0 },
      { source: '.good { & > .test { position: relative; } }', warnings: 0 },
      { source: '.good { & > .test { position: fixed; } }', warnings: 0 },
      { source: '.good { z-index: 0; position: relative; & > .test { z-index: 1; } }', warnings: 0 },
      { source: '.good { padding: 100px; }', warnings: 0 },
      { source: `.good { &::before { content: ''; color: back; } }`, warnings: 0 },
      { source: `.good { pointer-events: none; & > * { pointer-events: auto; } }`, warnings: 0 },
      { source: `.good { & > * { display: none; } }`, warnings: 0 },
    ],
    invalid: [
      {
        title: 'report error when using layout related props in root',
        source: `
          .bad {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
            grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            justify-self: 0; align-self: 0;
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
          'max-width', 'min-width', 'max-height', 'min-height',
        ])
      },
      {
        source: `.bad { position: fixed; }`,
        warnings: [messages['root - no layout related props']('position: fixed')]
      },
      {
        title: '└─ take @media into account',
        source: `
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
        ])
      },
      {
        title: 'report error when using intrinsic size without !important',
        source: '.bad { width: 10px; height: 10px; }',
        warnings: createMessages('root - no layout related props', ['width', 'height'])
      },
      {
        title: 'report error when using non intrinsic unit without !important',
        source: '.bad { width: 10% !important; height: 10% !important; }',
        warnings: createMessages('root - no layout related props', ['width', 'height'])
      },
      {
        source: '.good { height: 0; padding-bottom: 10px; }',
        warnings: [messages['root - no layout related props']('height')]
      },
      {
        source: '.bad { & > .test { padding: 100px; color: 0; } }',
        warnings: createMessages('nested - only layout related props in nested', [
          'padding', 'color'
        ])
      },
      {
        title: '└─ take @media into account',
        source: '.bad { & > .test { @media x { padding: 100px; } } }',
        warnings: createMessages('nested - only layout related props in nested', ['padding'])
      },
      {
        source: '.bad { & > .test { display: block; } }',
        warnings: [messages['nested - only layout related props in nested']('display')]
      },
      {
        source: '.bad { &:not(.is-open) > .test { padding: 0; } }',
        warnings: [messages['nested - only layout related props in nested']('padding')]
      },
    ]
  }
}
