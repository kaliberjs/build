const webpack = require('webpack')

module.exports = { dynamicEntries }

/**
 * @template T
 * @typedef {T extends (infer X | infer Y) ? (X extends Function ? X : FunctionType<Y>) : never} FunctionType
 */

/**
 * @param {Extract<webpack.EntryNormalized, Function>} createEntries
 * @param {{ compiler: webpack.Compiler }} props
 */
function dynamicEntries(createEntries, { compiler }) {
  new webpack.DynamicEntryPlugin(compiler.context, createEntries).apply(compiler)
}
