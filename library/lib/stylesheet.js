import hotCssReplacementClient from 'raw-loader!./hot-css-replacement-client'

const isProduction = process.env.NODE_ENV === 'production'

export default [
  <link href={`/${__webpack_css_chunk_hash__}.css`} rel='stylesheet' type='text/css' key='hotCssReplacementClient_0' />,
  !isProduction && createHotReload(__webpack_websocket_port__, __webpack_hash__, __webpack_css_chunk_hash__, __webpack_chunkname__)
].filter(Boolean)

function createHotReload(port, compilationHash, cssHash, chunkName) {
  return <script
    key='hotCssReplacementClient_1'
    dangerouslySetInnerHTML={{
      __html: `(${hotCssReplacementClient})(${port}, '${compilationHash}', '${cssHash}', '${chunkName}')`
    }}/>
}
