/*
  Emits the given source as a json file
*/

const { relative } = require('path')

module.exports = function ToJsonFileLoader(source) {
  const filename = relative(this.options.context, this.resourcePath)
  this.emitFile(filename + '.json', JSON.stringify(source))
  return '// json file was emitted'
}
