const { messages } = require('./')

function createMessages(key, values) { return values.map(messages[key]) }

module.exports = {
  'parent-child-policy': {
    valid: [
      { source: '.good { position: relative; z-index: 0; & > .test { z-index: 1; } }' },
      { source: '.good { position: relative; & > .test { position: absolute; } }' },
      {
        title: `don't report when display flex is present`,
        source: `
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
        source: `
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
        source: '.good { pointer-events: auto; }',
      },
      {
        source: '.good { pointer-events: none; & > * { pointer-events: auto; } }',
      },
      {
        title: 'detect in non-direct children',
        source: `
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
      }
    ],
    invalid: [
      {
        title: 'report missing stacking context',
        source: '.bad { & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: 'report missing stacking context - only `position: relative`',
        source: '.bad { position: relative; & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: 'report missing stacking context - only `z-index: 0`',
        source: '.bad { z-index: 0; & > .test { z-index: 0; } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { & > .test { @media x { z-index: 0; } } }',
        warnings: [messages['nested - missing stacking context in parent']]
      },
      {
        source: '.bad { & > .test { position: absolute; } }',
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        title: '└─ take @media into account',
        source: '.bad { & > .test { @media x { position: absolute; } } }',
        warnings: [messages['nested - absolute has relative parent']]
      },
      {
        title: '└─ take @media and @supports into account',
        source: `
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
        source: `
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
        source: `
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
        source: `
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
        source: `
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
        source: `
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
        source: `
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
        source: '.bad { & > * { pointer-events: auto; } }',
        warnings: [messages['invalid pointer events']]
      },
    ]
  }
}
