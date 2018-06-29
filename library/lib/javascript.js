/* global __webpack_js_chunk_information__, __webpack_public_path__ */

export default getSharedChunkFileNames(__webpack_js_chunk_information__).map((filename, index) =>
  <script key={`javascript_${index}`} defer src={__webpack_public_path__ + filename} />
)

function getSharedChunkFileNames({ javascriptChunkNames, manifest }) {
  const sharedChunks = []

  javascriptChunkNames.forEach(javascriptChunkName => {
    const chunkManifest = manifest[javascriptChunkName]
    chunkManifest.group.forEach(x => addFilename(manifest[x]))
    addFilename(chunkManifest)
  })

  return sharedChunks

  function addFilename({ filename }) {
    if (!sharedChunks.includes(filename)) sharedChunks.push(filename)
  }
}
