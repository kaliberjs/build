const { messages } = require('./stylelint-plugins/kaliber')

module.exports = {
  'kaliber/stylelint': [
    {
      source: '.test { z-index: 0; }',
      warnings: [messages['root - z-index without position relative']]
    },
    {
      source: '.test { position: relative; z-index: 1; }',
      warnings: [messages['root - z-index not 0']]
    },
    { source: '.test { position:relative; z-index: 0; }', warnings: 0 },
    {
      source: '.test1 { & > test2 { z-index: 0; } }',
      warnings: [messages['nested - missing stacking context in parent']]
    },
    {
      source: '.test1 { position: relative; & > test2 { z-index: 0; } }',
      warnings: [messages['nested - missing stacking context in parent']]
    },
    {
      source: '.test1 { z-index: 0; & > test2 { z-index: 0; } }',
      warnings: [
        messages['root - z-index without position relative'],
        messages['nested - missing stacking context in parent']
      ]
    },
    { source: '.test { position:relative; z-index: 0; & > test2 { z-index: 0; } }', warnings: 0 },
  ]
}