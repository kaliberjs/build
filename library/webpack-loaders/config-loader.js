module.exports = ConfigLoader

/** @type {import('webpack').loader.Loader} */
function ConfigLoader() {}

ConfigLoader.pitch = function ConfigLoaderPitch() {

  const result = require('@kaliber/config')

  return `module.exports = ${JSON.stringify(result)};`
}
