const { messages } = require('./')
const layoutRelatedProperties = require('../layout-related-properties')
const { test } = require('../../machinery/test')

function createMessages(key, values) { return values.map(messages[key]) }

test('parent-child-policy', {
  'parent-child-policy': {
    valid: [
      { code: '.good { position: relative; z-index: 0; & > .test { z-index: 1; } }' },
      { code: '.good { & > .test { z-index: unset; } }' },
      { code: '.good { position: relative; & > .test { position: absolute; } }' },
      {
        title: `don't report when display flex is present`,
        code: `
          .good {
            display: flex;

            & > .test {
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0; order: 0;
            }
          }
        `,
      },
      {
        title: `don't report when display grid is present`,
        code: `
          .good {
            display: grid;

            & > .test {
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0; order: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            }
          }
        `,
      },
      {
        code: '.good { pointer-events: auto; }',
      },
      {
        code: '.good { pointer-events: none; & > * { pointer-events: auto; } }',
      },
      { code: '.good { &::after { pointer-events: none; } }' },
      {
        title: 'detect in non-direct children',
        code: `
        .Abc {
          position: relative;
          &.isX {
            & .AbcDef { position: absolute; }
            & > .AbcGhi { }
          }
          &:hover {
            & .AbcDef { }
            & > .AbcGhi {
              & > .AbcJkl { position: absolute; }
            }
          }
        }
        `
      },
      {
        code: `
          .parent {
            position: relative;

            & > .child {
              position: static;
            }
          }
        `
      },
      {
        title: 'allow flex prop when media query removed flex and specifies `unset`',
        code: `
          .parent {
            display: flex;

            @media (--mq-viewport-md) {
              display: block;
            }

            & > .child {
              flex: 1 1 auto;
              @media (--mq-viewport-md) {
                flex: unset;
              }
            }
          }
        `,
      },
      {
        title: 'allow flex prop when media query removed flex and specifies `unset`',
        code: `
          .parent {
            display: grid;

            @media (--xyz) {
              display: block;
            }

            & > .child {
              flex-column: 1;
              @media (--xyz) {
                flex-column: unset;
              }
            }
          }
        `,
      },
    ],
    invalid: [
      {
        title: 'report missing stacking context',
        code: '.bad { & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: 'report missing stacking context - only `position: relative`',
        code: '.bad { position: relative; & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: 'report missing stacking context - only `z-index: 0`',
        code: '.bad { z-index: 0; & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { & > .test { @media x { z-index: 0; } } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        code: '.bad { & > .test { position: absolute; } }',
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        code: '.bad { & > .test { position: static; } }',
        warnings: [
          messages['missing position relative'],
        ]
      },
      {
        title: '└─ take @media into account',
        code: '.bad { & > .test { @media x { position: absolute; } } }',
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        title: '└─ take @media and @supports into account',
        code: `
          .bad {
            @supports x {
              position: relative;
            }

            & > .test {
              @media x {
                position: absolute;
              }
            }
          }
        `,
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        title: '└─ take @media and @supports into account 2',
        code: `
          .bad {
            @media x {
              position: relative;
            }

            & > .test {
              @supports x {
                position: absolute;
              }
            }
          }
        `,
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        title: 'report missing flex',
        code: `
          .bad {
            & > .test {
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
            }
          }
        `,
        warnings: createMessages('nested - require display flex in parent', [
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
        ])
      },
      {
        title: '└─ take @media into account',
        code: `
          .bad {
            & > .test {
              @media x {
                flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
              }
            }
          }
        `,
        warnings: createMessages('nested - require display flex in parent', [
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
        ])
      },
      {
        title: 'report missing grid',
        code: `
          .bad {
            & > .test {
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            }
          }
        `,
        warnings: createMessages('nested - require display grid in parent', [
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
        ])
      },
      {
        title: `└─ take @media into account`,
        code: `
          .bad {
            & > .test {
              @media x {
                grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
                grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
              }
            }
          }
        `,
        warnings: createMessages('nested - require display grid in parent', [
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
        ])
      },
      {
        title: `└─ take @supports into account`,
        code: `
          .bad {
            & > .test {
              @supports x {
                grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
                grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
              }
            }
          }
        `,
        warnings: createMessages('nested - require display grid in parent', [
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
        ])
      },
      {
        code: '.bad { & > * { pointer-events: auto; } }',
        warnings: [messages['invalid pointer events']]
      },
      {
        title: 'disallow flex prop when media query removed flex',
        code: `
          .parent {
            display: flex;

            @media (--mq-viewport-md) {
              display: block;
            }

            & > .child {
              flex: 1 1 auto;
            }
          }
        `,
        warnings: [messages['nested - require display flex in parent']('flex')]
      },
      {
        title: 'report missing flex or grid',
        code: `.bad { & > .test { order: 0; } }`,
        warnings: createMessages('nested - require display flex or grid in parent', [
          'order'
        ])
      },
      {
        title: '└─ take @media into account',
        code: `.bad { & > .test { @media x { order: 0; } } }`,
        warnings: createMessages('nested - require display flex or grid in parent', [
          'order'
        ])
      },
    ]
  },
  'layout-related-properties': {
    valid: [
      { code: '.good { display: none; }' },
      { code: `.good { pointer-events: none; & > * { pointer-events: auto; } }` },
      { code: `.good { &::after { pointer-events: none; } }` },
      {
        code: `
          .parent {
            position: relative;

            & > .child {
              position: static;
            }
          }
        `
      },
    ],
    invalid: [
      {
        code: '.bad { & > * { pointer-events: none; } }',
        warnings: [layoutRelatedProperties.messages['nested - only layout related props in nested']('pointer-events')]
      },
    ],
  },
})
