const pkgDir = require('pkg-dir')
const path = require('path')
const fs = require('fs-extra')

module.exports = {
  findCssGlobalFiles,
}

function findCssGlobalFiles(from) {
  const propertiesDirectory = path.resolve(pkgDir.sync(from), './src/cssGlobal')
  return fs.existsSync(propertiesDirectory)
    ? fs.readdirSync(propertiesDirectory).map(x => path.resolve(propertiesDirectory, x))
    : []
}
