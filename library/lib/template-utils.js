const ReactDOMServer = require('react-dom/server')
const { evalWithSourceMap, withSourceMappedError } = require('./node-utils')

module.exports = {
  createRenderFunction,
  renderWith
}

function createRenderFunction(source, createMap) {
  const template = evalWithSourceMap(source, createMap)
  
  render.routes = template.then(({ routes }) => routes)

  return render

  function render(props) {
    return template
      .then(createTemplateWith(createMap, props))
      .then(renderWith(createMap))
  }
}

function createTemplateWith(createMap, props) {
  return template => withSourceMappedError(createMap, () =>
    template(props)
  )
}

function renderWith(createMap) {
  return template => withSourceMappedError(createMap, () =>
    '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
  )
}
