const postcss = require('postcss')
const { extractICSS, replaceSymbols, replaceValueSymbols } = require('icss-utils')

const plugin = 'postcss-import-export-parser'

module.exports = postcss.plugin(
  plugin,
  ({ loadExports }) => async function process(css, result) {
    const { icssExports, icssImports } = extractICSS(css)

    const importedValues = await resolveImportedValues(css.source.input.file, icssImports, loadExports)

    replaceSymbols(css, importedValues)

    Object.entries(icssExports).forEach(([key, rawValue]) => {
      const value = replaceValueSymbols(rawValue, importedValues)
      result.messages.push({
        plugin,
        type: 'export',
        item: { key, value },
      })
    })
  }
)

async function resolveImportedValues(file, icssImports, loadExports) {
  return Object.entries(icssImports).reduce(
    async (result, [url, values]) => {
      const exportedValues = await loadExports(url, file)
      return {
        ...(await result),
        ...mapValues(values, x => exportedValues[x])
      }
    },
    {}
  )
}

function mapValues(o, f) {
  return Object.entries(o).reduce(
    (result, [k, v]) => {
      result[k] = f(v)
      return result
    },
    {}
  )
}
