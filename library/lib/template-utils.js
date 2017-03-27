const ReactDOMServer = require('react-dom/server')
const { evalWithSourceMap, withSourceMappedError } = require('./node-utils')

module.exports = {
  createRenderFunction,
  renderWith
}

function createRenderFunction(source, map) {
  return props => evalWithSourceMap(source, map)
    .then(createTemplateWith(map, props))
    .then(renderWith(map)) 
}

function createTemplateWith(map, props) {
  return template => withSourceMappedError(map, () => 
    template(props)
  )
}

function renderWith(map) {
  return template => withSourceMappedError(map, () => 
    ReactDOMServer.renderToStaticMarkup(template)
  )
}
