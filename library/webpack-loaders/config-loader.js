const loaderUtils = require('loader-utils')

module.exports = function ConfigLoader (source) {
  const supportedConfigPhases = ['dev', 'tst', 'acc', 'prd']

  if (process.env.CONFIG_ENV && !supportedConfigPhases.includes(process.env.CONFIG_ENV)) {
    throw new Error(`Unsupported CONFIG_ENV \`${process.env.CONFIG_ENV}\`, expected one of ${supportedConfigPhases}`)
  }

  const result = this.exec(source, this.resourcePath)

  return `module.exports = ${JSON.stringify(result)};`
}
