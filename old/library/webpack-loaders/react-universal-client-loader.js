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
          |import { hydrate } from 'react-dom'
          |
          |const elements = document.querySelectorAll('*[data-componentid="${id}"]')
          |for (let i = 0; i < elements.length; i++) {
          |  const props = JSON.parse(elements[i].dataset.props)
          |  hydrate(<Component {...props} />, elements[i])
          |}
          |
          |if (module.hot) {
          |  require('@kaliber/build/lib/hot-module-replacement-client')
          |  module.hot.accept('./${importPath}', () => {
          |    for (let i = 0; i < elements.length; i++) {
          |      const props = JSON.parse(elements[i].dataset.props)
          |      hydrate(<Component {...props} />, elements[i])
          |    }
          |  })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
