const { messages } = require('./stylelint-plugins/kaliber')
const stylelint = require('stylelint')

// patch in order to add support for filenames to tape
const originalLint = stylelint.lint.bind(stylelint)
stylelint.lint = function lint({ code, ...otherOptions }) {
  const options = (typeof code === 'object')
    ? { code: code.source, codeFilename: code.filename }
    : { code }
  return originalLint({ ...options, ...otherOptions })
}


function message(key) {
  const x = messages[key]
  return x || `programming error, message with key '${key}' not found`
}

function createMessages(key, values) {
  const x = messages[key]
  return values.map(x)
}

const tests = createTests()
const colorSchemeTests = require('./stylelint-plugins/rules/color-schemes/test')
const cssGlobalTests = require('./stylelint-plugins/rules/css-global/test')
const layoutRelatedPropertiesTests = require('./stylelint-plugins/rules/layout-related-properties/test')
const namingPolicyTests = require('./stylelint-plugins/rules/naming-policy/test')
const selectorPolicyTests = require('./stylelint-plugins/rules/selector-policy/test')
const testEntries = [
  ...Object.entries(colorSchemeTests),
  ...Object.entries(cssGlobalTests),
  ...Object.entries(layoutRelatedPropertiesTests),
  ...Object.entries(namingPolicyTests),
  ...Object.entries(selectorPolicyTests),
]

const allTests = testEntries.reduce(
  (result, [rule, { valid, invalid }]) => ({
    ...result,
    [`kaliber/${rule}`]: (result[`kaliber/${rule}`] || [])
      .concat(valid.map(x => (!x.expect && (x.warnings = x.warnings || 0), x)))
      .concat(invalid)
  }),
  tests
)

module.exports = allTests

function createTests() {
  return {
    'kaliber/valid-stacking-context-in-root': [
      {
        title: "don't allow `z-index` in root without `position: relative`",
        source: '.bad { z-index: 0; }',
        warnings: [message('root - z-index without position relative')]
      },
      {
        title: "├─ take @media into account [1]",
        source: `.bad { @media x { z-index: 0; } }`,
        warnings: [message('root - z-index without position relative')]
      },
      {
        title: "└─ take @media into account [2]",
        source: `.bad { z-index: 0; @media x { position: relative; } }`,
        warnings: [message('root - z-index without position relative')]
      },
      {
        title: "only allow a `z-index: 0` in root",
        source: '.bad { position: relative; z-index: 1; }',
        warnings: [message('root - z-index not 0')]
      },
      { source: '.good { position: relative; z-index: 0; }', warnings: 0 },
      {
        title: "├─ take @media into account [1]",
        source: `
          .good {
            position: relative;
            @media x {
              z-index: 0;
            }
          }
        `,
        warnings: 0
      },
      {
        title: "└─ take @media into account [2]",
        source: `
          .good {
            @media x {
              z-index: 0;
              position: relative;
            }
          }
        `,
        warnings: 0
      },
      {
        title: "└─ take class chaining into account [1]",
        source: `
          .good {
            &.test {
              z-index: 0;
              position: relative;
            }
          }
        `,
        warnings: 0
      },
      {
        title: "└─ take class chaining into account [2]",
        source: `
          .good {
            position: relative;
            &.test {
              z-index: 0;
            }
          }
        `,
        warnings: 0
      },
    ],
    'kaliber/require-stacking-context-in-parent': [
      {
        title: "report missing stacking context",
        source: '.bad { & > .test { z-index: 0; } }',
        warnings: [message('nested - missing stacking context in parent')]
      },
      {
        title: "report missing stacking context - only `position: relative`",
        source: '.bad { position: relative; & > .test { z-index: 0; } }',
        warnings: [message('nested - missing stacking context in parent')]
      },
      {
        title: "report missing stacking context - only `z-index: 0`",
        source: '.bad { z-index: 0; & > .test { z-index: 0; } }',
        warnings: [message('nested - missing stacking context in parent')]
      },
      {
        title: "└─ take @media into account",
        source: '.bad { & > .test { @media x { z-index: 0; } } }',
        warnings: [message('nested - missing stacking context in parent')]
      },
      { source: '.good { position: relative; z-index: 0; & > .test { z-index: 1; } }', warnings: 0 },
    ],
    'kaliber/layout-related-properties': [
      {
        title: "report error when using layout related props in root in index.css",
        source: {
          filename: 'index.css',
          source:`
            div {
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
        warnings: 0
      },
      {
        title: 'prevent some layout related props in root in reset.css',
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
        warnings: createMessages('root - no layout related props', [
          'position: absolute',
          'top', 'right', 'bottom', 'left',
          'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
          'grid', 'grid-area', 'grid-column', 'grid-row',
          'grid-column-start', 'grid-column-end', 'grid-row-start', 'grid-row-end',
        ])
      },
    ],
    'kaliber/absolute-has-relative-parent': [
      {
        source: '.bad { & > .test { position: absolute; } }',
        warnings: [message('nested - absolute has relative parent')]
      },
      {
        title: "└─ take @media into account",
        source: '.bad { & > .test { @media x { position: absolute; } } }',
        warnings: [message('nested - absolute has relative parent')]
      },
      { source: '.good { position: relative; & > .test { position: absolute; } }'}
    ],
    'kaliber/selector-policy': [
      {
        title: 'allow tag selectors in reset.css',
        source: { filename: 'reset.css', source: 'div { }' },
        warnings: 0
      },
      {
        title: 'allow tag selectors in index.css',
        source: { filename: 'index.css', source: 'div { }' },
        warnings: 0
      },
    ],
    'kaliber/valid-flex-context-in-root': [
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
        title: "└─ take @media into account",
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
        title: "don't report when display flex is present",
        source: `
          .good {
            display: flex;

            & > .test {
              flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0; order: 0;
            }
          }
        `,
        warnings: 0
      }
    ],
    'kaliber/valid-grid-context-in-root': [
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
        title: "└─ take @media into account",
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
        title: "don't report when display grid is present",
        source: `
          .good {
            display: grid;

            & > .test {
              grid: 0; grid-area: 0; grid-column: 0; grid-row: 0;
              grid-column-start: 0; grid-column-end: 0; grid-row-start: 0; grid-row-end: 0;
            }
          }
        `,
        warnings: 0
      }
    ],
    'kaliber/only-tag-selectors-in-reset-and-index': [
      {
        title: 'invalid - no class in reset.css',
        source: { filename: 'reset.css', source: `.bad { }` },
        warnings: [messages['no class selectors']]
      },
      {
        title: "└─ take @media into account",
        source: { filename: 'reset.css', source: `@media x { .bad { } }` },
        warnings: [messages['no class selectors']]
      },
      {
        title: 'invalid - no class in index.css',
        source: { filename: 'index.css', source: `.bad { }` },
        warnings: [messages['no class selectors']]
      },
      {
        title: 'valid - allow tag in reset.css',
        source: { filename: 'reset.css', source: `div { }` },
        warnings: 0
      },
      {
        title: 'valid - allow tag in index.css',
        source: { filename: 'index.css', source: `div { }` },
        warnings: 0
      },
      {
        title: 'valid - allow global modifier class on body in index.css',
        source: { filename: 'index.css', source: `:global(body.prevent-scroll) { overflow: hidden; }` },
        warnings: 0
      },
      {
        title: 'valid - class selector not in index.css or reset.css',
        source: `.good { }`,
        warnings: 0
      },
    ],
    'kaliber/valid-pointer-events': [
      {
        source: '.bad { & > * { pointer-events: auto; } }',
        warnings: [messages['invalid pointer events']]
      },
      {
        source: '.good { pointer-events: auto; }',
        warnings: 0
      },
      {
        source: '.good { pointer-events: none; & > * { pointer-events: auto; } }',
        warnings: 0
      },
    ],
    'kaliber/no-import': [
      {
        source: `@import 'x';`,
        warnings: [messages['no import']]
      },
      {
        title: 'allow @import in *.entry.css',
        source: {
          filename: 'abc.entry.css',
          source: `@import 'x';`
        },
        warnings: 0
      },
      {
        title: 'allow font @import in index.css',
        source: {
          filename: 'index.css',
          source: `@import url('https://fonts.googleapis.com/css');`
        },
        warnings: 0
      },
      {
        title: 'prevent non-font @import in index.css',
        source: {
          filename: 'index.css',
          source: `@import 'x';`
        },
        warnings: [messages['only import font']]
      },
    ],
  }
}
