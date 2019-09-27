const { messages } = require('./stylelint-plugins/kaliber')

function message(key) {
  const x = messages[key]
  return x || `programming error, message with key '${key}' not found`
}

module.exports = {
  'kaliber/valid-stacking-context-in-root': [
    {
      source: '.bad { z-index: 0; }',
      warnings: [message('root - z-index without position relative')]
    },
    {
      source: '.bad { position: relative; z-index: 1; }',
      warnings: [message('root - z-index not 0')]
    },
    { source: '.good { position: relative; z-index: 0; }', warnings: 0 },
  ],
  'kaliber/require-stacking-context-in-parent': [
    {
      source: '.bad { & > .test { z-index: 0; } }',
      warnings: [message('nested - missing stacking context in parent')]
    },
    {
      source: '.bad { position: relative; & > .test { z-index: 0; } }',
      warnings: [message('nested - missing stacking context in parent')]
    },
    {
      source: '.bad { z-index: 0; & > .test { z-index: 0; } }',
      warnings: [message('nested - missing stacking context in parent')]
    },
    { source: '.good { position: relative; z-index: 0; & > .test { z-index: 1; } }', warnings: 0 },
  ],
  'kaliber/no-layout-related-props-in-root': [
    {
      source: '.bad { width: 100%; height: 100%; position: absolute; }',
      warnings: [
        message('root - no layout related props')('width'),
        message('root - no layout related props')('height'),
        message('root - no layout related props')('position: absolute'),
      ]
    },
    { source: '.good { & > .test { width: 100%; height: 100%; position: absolute; } }', warnings: 0 }
  ],
  'kaliber/no-double-nesting': [
    {
      source: '.bad { & > .test1 { & > .test2 { } } }',
      warnings: [message('nested - no double nesting')]
    },
    { source: '.good { & > .test { } }', warnings: 0 }
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
    { source: '.good { padding: 100px; }', warnings: 0 }
  ]
}