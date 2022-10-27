/* global __webpack_css_chunk_hashes__, __webpack_public_path__, __webpack_websocket_port__, __webpack_chunkname__ */

/*
  Links to the stylesheet and adds hot reloading for stylesheets
*/

import hotCssReplacementClient from './hot-css-replacement-client?transpiled-javascript-string'
// import crypto from 'crypto'

const isWatch = process.env.WATCH

export const hotReloadClient  = isWatch ? createHotReloadClient() : null

export default __webpack_css_chunk_hashes__
  .map(cssHash => <link href={`${__webpack_public_path__ + cssHash}.css`} rel='stylesheet' type='text/css' key={`stylesheet_${cssHash}`} />)
  .concat(hotReloadClient)
  .filter(Boolean)

function createHotReloadClient() {
  const [ port, cssHashes, chunkName, publicPath ] = [ __webpack_websocket_port__, __webpack_css_chunk_hashes__, __webpack_chunkname__, __webpack_public_path__ ]

  const scriptContent = `var d = document.currentScript.dataset;` +
   `(${hotCssReplacementClient})(d.port, JSON.parse(d.hashes), d.chunkname, d.publicpath)`
  // console.log({ cspHashStylesheet: crypto.createHash('sha256').update(scriptContent).digest('base64') })
  return (
    <script
      key='stylesheet_hotCssReplacementClient'
      data-publicpath={publicPath}
      data-port={port}
      data-hashes={JSON.stringify(cssHashes)}
      data-chunkname={chunkName}
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  )
}
