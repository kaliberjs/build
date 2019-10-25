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

// TODO: add @media query tests
module.exports = {
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
  'kaliber/no-layout-related-props-in-root': [
    {
      title: "report error when using layout related props in root",
      source: `
        .bad {
          width: 100%; height: 100%;
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
          flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
          max-width: 0; min-width: 0; max-height: 0; min-height: 0;
        }
      `,
      warnings: createMessages('root - no layout related props', [
        'width', 'height',
        'position: absolute',
        'top', 'right', 'bottom', 'left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
        'max-width', 'min-width', 'max-height', 'min-height',
      ])
    },
    {
      source: `.bad { position: fixed; }`,
      warnings: [messages['root - no layout related props']('position: fixed')]
    },
    {
      title: "└─ take @media into account",
      source: `
        .bad {
          @media x {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
          }
        }
      `,
      warnings: createMessages('root - no layout related props', [
        'width', 'height',
        'position: absolute',
        'top', 'right', 'bottom', 'left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      ])
    },
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
          }
        `,
      },
      warnings: createMessages('root - no layout related props', [
        'width', 'height',
        'position: absolute',
        'top', 'right', 'bottom', 'left',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      ])
    },
    {
      title: "report error when using intrinsic size without !important",
      source: '.bad { width: 10px; height: 10px; }',
      warnings: createMessages('root - no layout related props', ['width', 'height'])
    },
    {
      title: "report error when using non intrinsic unit without !important",
      source: '.bad { width: 10% !important; height: 10% !important; }',
      warnings: createMessages('root - no layout related props', ['width', 'height'])
    },
    {
      title: "don't report errors when layout related props are used in child",
      source: `
        .good {
          & > .test {
            width: 100%; height: 100%;
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
            flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
          }
        }
      `,
      warnings: 0
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
          }
        `,
      },
      warnings: createMessages('root - no layout related props', [
        'position: absolute',
        'top', 'right', 'bottom', 'left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      ])
    },
    {
      title: "don't report errors when layout related props are used in _root or component_root",
      source: `
        ._rootTest {
          width: 100%; height: 100%;
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
          flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
        }

        .component_rootTest {
          width: 100%; height: 100%;
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
          flex: 0; flex-grow: 0; flex-shrink: 0; flex-basis: 0;
        }
      `,
      warnings: 0
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
      warnings: 0
    },
    { source: '.good { width: 10px !important; height: 10px !important; }', warnings: 0 },
    { source: '.good { min-width: 10px !important; min-height: 10px !important; }', warnings: 0 },
    { source: '.good { max-width: 10px !important; max-height: 10px !important; }', warnings: 0 },
    { source: '.good { width: 10em !important; height: 10em !important; }', warnings: 0 },
    { source: '.good { width: 10rem !important; height: 10rem !important; }', warnings: 0 },
    { source: '.good { position: relative; }', warnings: 0 },
    { source: '.good { overflow: 0; }', warnings: 0 },
    { source: '.good { pointer-events: none; }', warnings: 0 },
    { source: '.good { display: none; }', warnings: 0 },
    {
      source: '.good { height: 0; padding-bottom: 10px; }',
      warnings: [messages['root - no layout related props']('height')]
    },
    {
      title: 'take @value into account',
      source: `
        @value x: 10px;
        .good {
          width: x !important;
        }
      `,
      warnings: 0
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
      warnings: 0
    },
    { source: '.good { height: 0; padding-bottom: 65.25%; }', warnings: 0 },
    { source: '.good { height: 0; padding-top: 65.25%; }', warnings: 0 },
    { source: '.good { z-index: 0; position: relative; }', warnings: 0 },
    { source: '.good { position: relative; & > .test { position: absolute; } }', warnings: 0 },
    { source: '.good { position: relative; z-index: 0; & > .test { position: absolute; z-index: 1; } }', warnings: 0 },
    { source: '.good { &::before { position: absolute; } }', warnings: 0 },
  ],
  'kaliber/no-double-nesting': [
    {
      source: '.bad { & > .test1 { & > .test2 { } } }',
      warnings: [message('nested - no double nesting')]
    },
    {
      title: "└─ take @media into account",
      source: '.bad { & > .test1 { @media x { & > .test2 { } } } }',
      warnings: [message('nested - no double nesting')]
    },
    { source: '.good { &.test1 { & > .test2 { } } }', warnings: 0 },
    { source: '.good { & > .test { } }', warnings: 0 },
    { source: '.good { & > .test { &:not(:last-child) { } } }', warnings: 0 },
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
  'kaliber/only-layout-related-props-in-nested': [
    {
      source: '.bad { & > .test { padding: 100px; color: 0; } }',
      warnings: createMessages('nested - only layout related props in nested', [
        'padding', 'color'
      ])
    },
    {
      title: "└─ take @media into account",
      source: '.bad { & > .test { @media x { padding: 100px; } } }',
      warnings: [message('nested - only layout related props in nested')('padding')]
    },
    { source: '.good { & > .test { width: 100%; } }', warnings: 0 },
    { source: '.good { & > .test { position: relative; } }', warnings: 0 },
    { source: '.good { & > .test { position: fixed; } }', warnings: 0 },
    { source: '.good { z-index: 0; position: relative; & > .test { z-index: 1; } }', warnings: 0 },
    { source: '.good { padding: 100px; }', warnings: 0 },
    { source: `.good { &::before { content: ''; color: back; } }`, warnings: 0 },
    { source: `.good { pointer-events: none; & > * { pointer-events: auto; } }`, warnings: 0 },
    { source: `.good { & > * { display: none; } }`, warnings: 0 },
    {
      source: '.bad { & > .test { display: block; } }',
      warnings: [messages['nested - only layout related props in nested']('display')]
    },
    {
      title: 'allow color related properties in color scheme css files',
      source: {
        filename: 'color-scheme/abc.css',
        source: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
      },
      warnings: 0
    },
    {
      source: '.bad { &:not(.is-open) > .test { padding: 0; } }',
      warnings: [messages['nested - only layout related props in nested']('padding')]
    },
  ],
  'kaliber/no-component-class-name-in-nested': [
    {
      source: '.bad { & > .componentTest { } }',
      warnings: [message('nested - no component class name in nested')('componentTest')]
    },
    {
      title: "└─ take @media into account",
      source: '.bad { @media x { & > .componentTest { } } }',
      warnings: [message('nested - no component class name in nested')('componentTest')]
    },
    { source: '.componentGood { & > .test { } }', warnings: 0 },
    { source: '.good { & > .test { } }', warnings: 0 },
  ],
  'kaliber/no-child-selectors-in-root': [
    {
      source: '.bad > .test { }',
      warnings: [message('root - no child selectors')]
    },
    {
      title: "└─ take @media into account",
      source: '@media x { .bad > .test { } }',
      warnings: [message('root - no child selectors')]
    },
    { source: '.good { & > .test { } }', warnings: 0 }
  ],
  'kaliber/no-double-child-selectors-in-nested': [
    {
      source: '.bad { & > .one > .two { } }',
      warnings: [message('nested - no double child selectors')]
    },
    {
      title: "└─ take @media into account",
      source: '.bad { @media x { & > .one > .two { } } }',
      warnings: [message('nested - no double child selectors')]
    },
    {
      title: 'correctly nested',
      source: `
        .good { & > .one { } }

        .one { & > .two { } }
      `,
      warnings: 0
    },
    {
      source: '.bad { & > .test::after { } }',
      warnings: [message('nested - no double child selectors')]
    },
    {
      title: 'correctly nested pseudo element',
      source: `
        .good { & > .one { } }

        .one { &::after { } }
      `,
      warnings: 0
    },
    { source: '.good { & > *:not(:first-child) { } }', warnings: 0 },
    {
      title: 'allow double child selectors in color schemes',
      source: {
        filename: 'color-scheme.css',
        source: '.good { & ::selection { } }'
      },
      warnings: 0
    },
  ],
  'kaliber/no-tag-selectors': [
    {
      source: 'div { }',
      warnings: [message('no tag selectors')]
    },
    {
      title: "└─ take @media into account",
      source: '@media x { div { } }',
      warnings: [message('no tag selectors')]
    },
    { source: '.good { }', warnings: 0 },
    { source: '@keyframes test { from { opacity: 0; } }', warnings: 0 },
    {
      source: '.bad { & > div { } }',
      warnings: [message('no tag selectors')]
    },
    {
      title: "└─ take @media into account",
      source: '.bad { @media x { & > div { } } }',
      warnings: [message('no tag selectors')]
    },
    {
      source: '.bad { & > div { } }',
      warnings: [message('no tag selectors')]
    },
    { source: '.good { & > .test { } }', warnings: 0 },
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
  'kaliber/only-direct-child-selectors': [
    {
      source: '.bad .test { }',
      warnings: [message('only direct child selectors')(' ')]
    },
    {
      title: "└─ take @media into account",
      source: '@media x { .bad .test { } }',
      warnings: [message('only direct child selectors')(' ')]
    },
    {
      source: '.bad { & .test { } }',
      warnings: [message('only direct child selectors')(' ')]
    },
    {
      source: '.bad { & > .test .one { } }',
      warnings: [message('only direct child selectors')(' ')]
    },
    {
      title: "└─ take @media into account",
      source: '.bad { @media x { & > .test .one { } } }',
      warnings: [message('only direct child selectors')(' ')]
    },
    {
      source: '.bad + .test { }',
      warnings: [message('only direct child selectors')('+')]
    },
    {
      source: '.bad { & + * { } }',
      warnings: [message('only direct child selectors')('+')]
    },
    { source: '.good { &.test { } }', warnings: 0 },
    { source: '.good { & > .test { } }', warnings: 0 },
    {
      title: 'allow non direct child selector in color scheme',
      source: {
        filename: 'color-scheme/abc.css',
        source: '.good { & .test { } }'
      },
      warnings: 0
    },
    {
      source: `[data-context-scrolldir='down'] .good { color: 0; }`,
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
  'kaliber/media-no-child': [
    {
      title: "report nested child in media",
      source: `
        .bad {
          @media x {
            & > {
              width: 10px;
            }
          }
        }
      `,
      warnings: [messages['media - no nested child']]
    },
    {
      title: "don't report media in nested child",
      source: `
        .good {
          & > {
            @media x {
              width: 10px;
            }
          }
        }
      `,
      warnings: 0
    },
    {
      title: "report nested child in media (root)",
      source: `
        @media x {
          .bad {
            width: 10px;
          }
        }
      `,
      warnings: [messages['media - no nested child']]
    },
    {
      title: "don't report media in nested child (root)",
      source: `
        .good {
          @media x {
            width: 10px;
          }
        }
      `,
      warnings: 0
    },
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
  'kaliber/custom-properties': [
    {
      source: `:root { --x: 0; }`,
      warnings: [messages['no root selector']]
    },
    {
      title: 'valid - allow custom properties in cssGlobal',
      source: { filename: 'src/cssGlobal/abc.css', source: `:root { --x: 0; }` },
      warnings: 0,
    },
    {
      title: 'invalid - only allow :root in cssGlobal directory',
      source: {
        filename: 'src/cssGlobal/abc.css',
        source: `
          div { }
          .test { }
        `
      },
      warnings: Array(2).fill(messages['only root selector']),
    },
    {
      title: 'valid - allow custom media in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-media --x (max-width: 30em);`},
      warnings: 0
    },
    {
      title: 'valid - allow custom selectors in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;`},
      warnings: 0
    },
  ],
  'kaliber/custom-media': [
    {
      source: `@custom-media --x (max-width: 30em);`,
      warnings: [messages['no custom media']]
    },
    {
      title: 'valid - allow custom media in cssGlobal directory',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-media --x (max-width: 30em);` },
      warnings: 0,
    },
    {
      title: 'invalid - only allow @custom-media in cssGlobal directory',
      source: {
        filename: 'src/cssGlobal/abc.css',
        source: `
          @keyframe { }
          @media x { }
        `
      },
      warnings: Array(2).fill(messages['only custom media']),
    },
    {
      title: 'valid - allow custom properties in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `root { --x: 0; }`},
      warnings: 0
    },
    {
      title: 'valid - allow custom selectors in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;`},
      warnings: 0
    },
  ],
  'kaliber/custom-selectors': [
    {
      source: `@custom-selector :--x x;`,
      warnings: [messages['no custom selector']]
    },
    {
      title: 'valid - allow custom selectors in cssGlobal directory',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-selector :--x x;` },
      warnings: 0,
    },
    {
      title: 'invalid - only allow custom selector in cssGlobal directory',
      source: {
        filename: 'src/cssGlobal/abc.css',
        source: `
          @keyframe { }
          @media x { }
        `
      },
      warnings: Array(2).fill(messages['only custom selector']),
    },
    {
      title: 'valid - allow custom properties in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `root { --x: 0; }`},
      warnings: 0
    },
    {
      title: 'valid - allow custom media in globalCss',
      source: { filename: 'src/cssGlobal/abc.css', source: `@custom-media --x (max-width: 30em);`},
      warnings: 0
    },
  ],
  'kaliber/color-scheme': [
    {
      title: 'allow color related properties in color scheme css files',
      source: {
        filename: 'color-scheme/abc.css',
        source: '.good { & .test { color: 0; background-color: 0; border-color: 0; stroke: 0; fill: 0; } }'
      },
      warnings: 0,
    },
    {
      title: 'only allow color related properties in color scheme css files',
      source: {
        filename: 'color-scheme/abc.css',
        source: '.bad { padding: 0; & .test { margin: 0; } }'
      },
      warnings: createMessages('only color related properties', [
        'padding', 'margin'
      ])
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
  ]
}