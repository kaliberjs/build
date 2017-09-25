const { relative } = require('path')

const isProduction = process.env.NODE_ENV === 'production'
module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/\.]/g, '_')
  return createServerCode({ importPath, scriptSrc: filename, id })
}

function createServerCode({ importPath, scriptSrc, id }) {
  const appScript = isProduction
    ? `scriptSrcs => scriptSrcs.map(scriptSrc => <script defer key={scriptSrc} src={'/' + scriptSrc + '?v=${Date.now()}' }></script>)`
    : `|scriptSrcs => (<script dangerouslySetInnerHTML={{ __html: \`
       |(function () {
       |  window.addEventListener('load', () => {
       |    \${JSON.stringify(scriptSrcs)}.map(scriptSrc => {
       |      const script = document.createElement('script')
       |      script.src = '/' + scriptSrc + '?v=' + Date.now()
       |      script.async = false
       |      //script.setAttribute('defer', '')
       |      document.body.appendChild(script)
       |    })
       |  })
       |}())
       |\` }} />)`.split(/^[ \t]*\|/m).join('')

  return `|import Component from './${importPath}'
          |import { renderToString } from 'react-dom/server'
          |
          |export default function WrapWithScript(props) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <div>
          |      <div id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }}></div>
          |      { (${appScript})(__webpack_js_client_chunk_hashes__.map(x => x + '.js').concat('${scriptSrc}')) }
          |    </div>
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
