const { relative } = require('path')

module.exports = ReactUniversalClientLoader

function ReactUniversalClientLoader(source, map) {
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  return createClientCode({ importPath, id })
}

function createClientCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import { render } from 'react-dom'
          |
          |const element = document.getElementById('${id}')
          |const props = JSON.parse(element.dataset.props)
          |render(<Component {...props} />, element)
          |
          |if (module.hot) {
          |  require('@kaliber/build/lib/hot-module-replacement-client')
          |  module.hot.accept('./${importPath}', () => { render(<Component {...props} />, element) })
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
