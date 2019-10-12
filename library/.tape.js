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
      title: "└─ take @media into account",
      source: `
        .bad {
          @media x {
            z-index: 0;
          }
        }
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
        }
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
      warnings: 0
    },
    {
      title: 'allow some layout related props in root in reset.css',
      source: {
        filename: 'reset.css',
        source: `
          div {
            width: 100%; height: 100%;
            margin: 0; margin-top: 0; margin-right: 0; margin-bottom: 0; margin-left: 0;
          }
        `.replace(/         /g, ''),
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
        `.replace(/        /g, ''),
      },
      warnings: createMessages('root - no layout related props', [
        'position: absolute',
        'top', 'right', 'bottom', 'left',
        'flex', 'flex-grow', 'flex-shrink', 'flex-basis',
      ])
    },
    { source: '.good { width: 10px !important; height: 10px !important; }', warnings: 0 },
    { source: '.good { width: 10em !important; height: 10em !important; }', warnings: 0 },
    { source: '.good { width: 10rem !important; height: 10rem !important; }', warnings: 0 },
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
    { source: '.good { & > .test { } }', warnings: 0 },
    { source: '.good { & > .test { &:not(:last-child) { } } }', warnings: 0 },
  ],
  'kaliber/absolute-has-relative-parent': [
    {
      source: '.bad { & > .test { position: absolute; } }',
      warnings: [message('nested - absolute has relative parent')]
    },
    { source: '.good { position: relative; & > .test { position: absolute; } }'}
  ],
  'kaliber/only-layout-related-props-in-nested': [
    {
      source: '.bad { & > .test { padding: 100px; } }',
      warnings: [message('nested - only layout related props in nested')('padding')]
    },
    { source: '.good { & > .test { width: 100%; } }', warnings: 0 },
    { source: '.good { padding: 100px; }', warnings: 0 },
    { source: `.good { &::before { content: ''; color: back; } }`, warnings: 0 },
  ],
  'kaliber/no-component-class-name-in-nested': [
    {
      source: '.bad { & > .componentTest { } }',
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
    { source: '.good { & > .test { } }', warnings: 0 }
  ],
  'kaliber/no-double-child-selectors-in-nested': [
    {
      source: '.bad { & > .one > .two { } }',
      warnings: [message('nested - no double child selectors')]
    },
    {
      title: 'correctly nested',
      source: `
        .good { & > .one { } }

        .one { & > .two { } }
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
      warnings: 0
    },
    { source: '.good { & > *:not(:first-child) { } }', warnings: 0 },
  ],
  'kaliber/no-child-tag-selectors': [
    {
      source: '.bad { & > div { } }',
      warnings: [message('nested - no child element selectors')]
    },
    { source: '.good { & > .test { } }', warnings: 0 },
  ],
  'kaliber/only-direct-child-selectors': [
    {
      source: '.bad .test { }',
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
      source: '.bad + .test { }',
      warnings: [message('only direct child selectors')('+')]
    },
    {
      source: '.bad { & + * { } }',
      warnings: [message('only direct child selectors')('+')]
    },
    { source: '.good { &.test { } }', warnings: 0 },
    { source: '.good { & > .test { } }', warnings: 0 },
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
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
      `.replace(/        /g, ''),
      warnings: 0
    },
  ],
  'kaliber/only-element-selectors-in-reset': [
    {
      title: 'invalid - no tag in selector',
      source: { filename: 'other.css', source: `div { }` },
      warnings: ['?']
    },
    {
      title: 'valid - allow tag in reset.css',
      source: { filename: 'reset.css', source: `div { }` },
      warnings: 0
    }
  ],
  'kaliber/no-media-in-root': [
    {
      source: `.bad { } @media x { }`,
      warnings: ['?']
    },
    {
      source: `.good { @media x { } }`,
      warnings: 0
    }
  ]
}