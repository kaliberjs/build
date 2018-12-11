const postcss = require('postcss')
const { extractICSS } = require('icss-utils')

const plugin = 'postcss-export-parser'

module.exports = postcss.plugin(
  plugin,
  () => function process(css, result) {
    const { icssExports } = extractICSS(css)
    Object.entries(icssExports).forEach(([key, value]) => {
      result.messages.push({
        plugin,
        type: 'export',
        item: { key, value },
      });
    });
  }
)
