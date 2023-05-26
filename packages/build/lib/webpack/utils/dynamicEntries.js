import webpack from 'webpack'

/**
 * @param {Extract<webpack.EntryNormalized, Function>} createEntries
 * @param {{ compiler: webpack.Compiler }} props
 */
export function dynamicEntries(createEntries, { compiler }) {
  new webpack.DynamicEntryPlugin(compiler.context, createEntries).apply(compiler)
}
