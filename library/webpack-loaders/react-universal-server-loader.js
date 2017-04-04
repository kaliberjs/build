const { relative } = require('path')

module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/\.]/g, '_')
  return createServerCode({ importPath, scriptSrc: '/' + filename, id })
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
          |`.split(/^[ \t]*\|/m).join('')
}
