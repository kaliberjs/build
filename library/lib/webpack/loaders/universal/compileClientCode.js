const webpack = require('webpack')

module.exports = { compileClientCode }

/**
 * @param {{
 *   entry: string,
 *   parentCompilation: import('webpack').Compilation,
 *   id: string,
 *   outputOptions: Parameters<import('webpack').Compilation['createChildCompiler']>[1],
 *   plugins: Parameters<import('webpack').Compilation['createChildCompiler']>[2],
 * }} props
 * @returns {Promise<{
 *   entries: Array<import('webpack').Chunk>,
 *   compilation: import('webpack').Compilation,
 * }>}
 */
async function compileClientCode({ entry, parentCompilation, id, outputOptions, plugins }) {
  return new Promise((resolve, reject) => {
    // We might be in trouble because we can not set the 'target', as far as I can tell this only affects resolver options (like mainField)
    const compiler = parentCompilation.createChildCompiler(`web-${id}`, outputOptions, plugins.concat([
      new webpack.EntryPlugin(parentCompilation.compiler.context, entry),
    ]))
    compiler.runAsChild((e, entries, compilation) => {
      if (e) reject(e)
      else resolve({ entries, compilation })
    })
  })
}
