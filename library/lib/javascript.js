export default getSharedChunkFileNames(__webpack_js_chunk_information__).map((filename, index) =>
  <script key={`javascript_${index}`} defer src={__webpack_public_path__ + filename} />
)

function getSharedChunkFileNames({ universalChunkNames, manifest }) {
  const sharedChunks = []

  universalChunkNames.forEach(universalChunkName => {
    addParents(manifest[universalChunkName].parents)
  })

  return sharedChunks

  function addParents(parents) {
    parents.map(x => manifest[x]).forEach(addFilenames)
  }

  function addFilenames({ filename, hasRuntime, parents }) {
    addParents(parents)
    if (!sharedChunks.includes(filename)) {
      if (hasRuntime) sharedChunks.unshift(filename)
      else sharedChunks.push(filename)
    }
  }
}
