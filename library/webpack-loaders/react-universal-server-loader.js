const { relative } = require('path')

const isProduction = process.env.NODE_ENV === 'production'
module.exports = ReactUniversalServerLoader

function ReactUniversalServerLoader(source, map) {
  const filename = relative(this.options.context, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  return createServerCode({ importPath, scriptSrc: '/' + filename, id })
}

function createServerCode({ importPath, scriptSrc, id }) {
  const appScript = isProduction
    ? `<script defer src='${scriptSrc}?v=${Date.now()}'></script>`
    : `|<script dangerouslySetInnerHTML={{ __html: \`
       |(function () {
       |  window.addEventListener('load', function () {
       |    const script = document.createElement('script')
       |    script.setAttribute('src', '${scriptSrc}?v=' + Date.now())
       |    script.setAttribute('defer', '')
       |    document.body.appendChild(script)
       |  })
       |}())
       |\` }} />`.split(/^[ \t]*\|/m).join('')

  return `|import Component from './${importPath}'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |
          |assignStatics(WrapWithScript, Component)
          |
          |export default function WrapWithScript(props) {
          |  const content = renderToString(<Component id='${id}' {...props} />)
          |  return (
          |    <div>
          |      <div id='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }}></div>
          |      ${appScript}
          |    </div>
          |  )
          |}
          |`.split(/^[ \t]*\|/m).join('')
}
