module.exports = { addBuiltInVariable }

function addBuiltInVariable({ parser }) {
//https://github.com/webpack/webpack/commit/48958dedd3a7c9982498ef0e1ee8edf4cb9d80e9

  // const info = REPLACEMENTS[key]
  // parser.hooks.expression
  //   .for(key)
  //   .tap(
  //     PLUGIN_NAME,
  //     toConstantDependency(parser, info.expr, info.req)
  //   )
  // if (info.assign === false) {
  //   parser.hooks.assign.for(key).tap(PLUGIN_NAME, expr => {
  //     const err = new WebpackError(`${key} must not be assigned`)
  //     err.loc = expr.loc
  //     throw err
  //   })
  // }
  // if (info.type) {
  //   parser.hooks.evaluateTypeof
  //     .for(key)
  //     .tap(PLUGIN_NAME, evaluateToString(info.type))
  // }
}
