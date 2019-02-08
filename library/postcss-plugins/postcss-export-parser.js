const postcss = require('postcss')
const { extractICSS } = require('icss-utils')

const plugin = 'postcss-export-parser'

module.exports = postcss.plugin(
  plugin,
  () => function process(css, result) {
    const { icssExports, icssImports } = extractICSS(css)

    if (Object.keys(icssImports).length) {
      console.log('Found imports, do we need to process them?')
      console.log(JSON.stringify(icssExports, null, 2))
    }

    Object.entries(icssExports).forEach(([key, value]) => {
      result.messages.push({
        plugin,
        type: 'export',
        item: { key, value },
      });
    });
  }
)
