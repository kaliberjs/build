const { relative } = require('path')
const { OriginalSource } = require('webpack-sources')

module.exports = ReactUniversalClientLoader

function ReactUniversalClientLoader(source, map, meta) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const code = createClientCode({ importPath, id })
  const generated = new OriginalSource(code, this.resourcePath + '?generated').sourceAndMap()
  this.callback(null, generated.source, generated.map, meta)
}

function createClientCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import { hydrateRoot } from 'react-dom/client'
          |
          |const elements = Array.from(document.querySelectorAll('*[data-componentid="${id}"]'))
          |const renderResults = elements.map(element => {
          |  const props = JSON.parse(element.dataset.props)
          |  return { props, root: hydrateRoot(element, <Component {...props} />) }
          |})
          |
          |if (module.hot) {
          |  require('@kaliber/build/lib/hot-module-replacement-client')
          |  module.hot.accept('./${importPath}', () => {
          |    renderResults.forEach(({ props, root }) => root.render(<Component {...props} />))
          |  })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
