const { getOptions } = require('loader-utils')
const { relative, basename } = require('path')

module.exports = ReactUniversalSupport

const universalClientMarker = '?universal-client'
const universalMarker = '?universal'

ReactUniversalSupport.universalClientMarker = universalClientMarker 

function ReactUniversalSupport(source, map) {
  if (!this.resourceQuery) return source
  else {
    const filename = relative(this.options.context, this.resourcePath)
    const importPath = relative(this.context, this.resourcePath)
    const id = filename.replace(/[/\.]/g, '_')
    if (this.resourceQuery === universalMarker) {
      if (!this.addEntry) { 
        this.callback(new Error('react-universal-support can not be used without the react-universal-plugin'))
        return
      }
      const callback = this.async()
      const serverCode = createServerCode({ importPath, scriptSrc: filename, id })
      this.addEntry('./' + filename + universalClientMarker, filename, err => callback(err, serverCode))
    } else if (this.resourceQuery === universalClientMarker) {
      return createClientCode({ importPath, id })
    }
  }
}

function createServerCode({ importPath, scriptSrc, id }) {
  return `|import Component from './${importPath}'
          |import { renderToString } from 'react-dom/server'
          |
          |export default function WrapWithScript(props) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <div>
          |      <div id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }}></div>
          |      <script src='${scriptSrc}'></script>
          |    </div>
          |  )
          |}
          |`.split(/[ \t]*\|/).join('')
}

function createClientCode({ importPath, id }) {
  return `|import Component from './${importPath}'
          |import { render } from 'react-dom'
          |
          |const element = document.getElementById('${id}')
          |render(<Component {...JSON.parse(element.dataset.props)} />, element)
          |`.split(/[ \t]*\|/).join('')
}
