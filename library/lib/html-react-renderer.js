const ReactDOMServer = require('react-dom/server')

module.exports = function htmlReactRenderer(template) {
  return '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
}