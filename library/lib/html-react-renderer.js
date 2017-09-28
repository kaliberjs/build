const ReactDOMServer = require('react-dom/server')

module.exports = function htmlReactRenderer (template) {
  if (!template) return template
  return '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
}
