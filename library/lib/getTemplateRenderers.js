const { kaliber: { templateRenderers: configuredTemplateRendererd = {} } = {} } = require('@kaliber/config')

module.exports = Object.assign({
  html: '@kaliber/build/lib/html-react-renderer',
  txt: '@kaliber/build/lib/txt-renderer',
  json: '@kaliber/build/lib/json-renderer'
}, configuredTemplateRendererd)
