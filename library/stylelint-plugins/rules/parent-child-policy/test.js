const { messages } = require('./')
const { test } = require('../../machinery/test')

function createMessages(key, values) { return values.map(messages[key]) }

test('parent-child-policy', {
  'parent-child-policy': {
    valid: [
      { code: '.good { position: relative; z-index: 0; & > .test { z-index: 1; } }' },
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
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
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
        title: 'allow position: static 1',
        code: `
          .test {
            position: relative;

            & > .relativeToParent {
              position: static;
            }
          }
        `
      },
      {
        title: 'allow position: static 2',
        code: `
          .parent {
            position: relative;

            & > .child.relativeToParent {
              position: static;
            }
          }
        `
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
          messages['missing relativeToParent className'],
        ]
      },
      {
        code: '.bad { & > .test.relativeToParent { position: static; } }',
        warnings: [messages['missing position relative']]
      },
      {
        code: '.bad { position: relative; & > .test { position: static; } }',
        warnings: [messages['missing relativeToParent className']]
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
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0; order: 0;
            }
          }
        `,
        warnings: createMessages('nested - require display flex in parent', [
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'order'
        ])
      },
      {
        title: '└─ take @media into account',
        code: `
          .bad {
            & > .test {
              @media x {
                flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0; order: 0;
              }
            }
          }
        `,
        warnings: createMessages('nested - require display flex in parent', [
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'order'
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
    ]
  },
  'layout-related-properties': {
    valid: [
      { code: '.good { display: none; }' },
      { code: `.good { pointer-events: none; & > * { pointer-events: auto; } }` },
      {
        title: 'allow position: static',
        code: `
          .test {
            position: relative;

            & > .relativeToParent {
              position: static;
            }
          }
        `
      },
    ],
    invalid: [
    ],
  },
})
