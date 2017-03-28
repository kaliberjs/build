const ReactDOMServer = require('react-dom/server')
const { evalWithSourceMap, withSourceMappedError } = require('./node-utils')

module.exports = {
  createRenderFunction,
  renderWith
}

function createRenderFunction(source, map) {
  const template = evalWithSourceMap(source, map)
  
  render.routes = template.then(({ routes }) => routes)

  return render

  function render(props) {
    return template
      .then(createTemplateWith(map, props))
      .then(renderWith(map))
  }
}

function createTemplateWith(map, props) {
  return template => withSourceMappedError(map, () => 
    template(props)
  )
}

function renderWith(map) {
  return template => withSourceMappedError(map, () => 
    '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
  )
}
