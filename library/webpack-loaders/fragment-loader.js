/*
  Adds support for resources with fragments like johny.svg#head
*/

const loaderUtils = require('loader-utils')
const path = require('path')

module.exports = FragmentLoader

function FragmentLoader(source) {

  const options =  new URLSearchParams(this.resourceQuery.slice(1))
  const fragment = (x => x ? '#' + x : '')(options.get('fragment'))

  const hash = loaderUtils.getHashDigest(source)
  const { ext } = path.parse(this.resourcePath)
  const outputPath = hash + ext

  this.emitFile(outputPath, source)

  return `module.exports = __webpack_public_path__ + ${JSON.stringify(outputPath + fragment)};`
}

FragmentLoader.raw = true
