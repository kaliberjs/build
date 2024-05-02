const ReactDOMServer = require('react-dom/server')
const { isValidElement } = require('react')

module.exports = function htmlReactRenderer(template) {
  if (!isValidElement(template)) return template
  return '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
}
