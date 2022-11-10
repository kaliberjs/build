/*
  This loader turns a request for a template into something that returns an object containing
  both the template and the renderer.
*/

// const loaderUtils = require('loader-utils')

module.exports = TemplateLoader

function TemplateLoader(source, map) {
}
/** @type {import('webpack').LoaderDefinitionFunction} */
TemplateLoader.pitch = function TemplateLoaderPitch(remainingRequest, precedingRequest, data) {
  const { renderer: rendererPath } = this.getOptions()
  // This should tell us what we need to use: https://webpack.js.org/configuration/module/#rule-enforce
  return `|export { default as template } from '-!${precedingRequest}!${remainingRequest}?template-source'
          |export { default as renderer } from '${rendererPath}'
          |`.split(/^[ \t]*\|/m).join('')
}
