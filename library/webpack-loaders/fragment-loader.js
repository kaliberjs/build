/*
  Adds support for resources with fragments like johny.svg#head
*/

const fileLoader = require('file-loader')
const loaderUtils = require('loader-utils')
const path = require('path')

module.exports = FragmentLoader

function FragmentLoader(source) {

  const options =  this.resourceQuery && loaderUtils.parseQuery(this.resourceQuery) || {}
  const fragment = (x => x ? '#' + x : '')(options.fragment)

  const hash = loaderUtils.getHashDigest(source)
  const { ext } = path.parse(this.resourcePath);
  const outputPath = hash + ext

  this.emitFile(outputPath, source)

  return `module.exports = __webpack_public_path__ + ${JSON.stringify(outputPath + fragment)};`
}

FragmentLoader.raw = true