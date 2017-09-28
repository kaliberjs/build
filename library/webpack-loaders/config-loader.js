/*
  Instead of loading @kaliber/config we execute it, remove the `kaliber` key and stringify the result
*/

const supportedConfigPhases = ['dev', 'tst', 'acc', 'prd']

module.exports = ConfigLoader

function ConfigLoader () {}

ConfigLoader.pitch = function ConfigLoaderPitch () {

  if (process.env.CONFIG_ENV && !supportedConfigPhases.includes(process.env.CONFIG_ENV)) {
    throw new Error(`Unsupported CONFIG_ENV \`${process.env.CONFIG_ENV}\`, expected one of ${supportedConfigPhases}`)
  }

  const result = require('@kaliber/config')
  delete result.kaliber

  return `module.exports = ${JSON.stringify(result)};`
}
