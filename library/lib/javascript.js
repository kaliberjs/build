/* global __webpack_js_chunk_information__, __webpack_public_path__ */

const { universalChunkNames, manifest } = __webpack_js_chunk_information__

export default getSharedScriptsForAll(universalChunkNames)

export function getSharedScriptsFor(name) {
  return getSharedScriptsForAll([name])
}

export function getSharedScriptsForAll(names) {
  const sharedChunks = []

  names.forEach(name => {
    const info = manifest[name]
    if (!info) throw new Error(`Could not find information in manifest for ${name}`)
    addChunk(info)
  })

  return sharedChunks.map(toScripts)

  function addChunk ({ dependencies = [], filename }) {
    dependencies.sort((a, b) => b === 'runtime' ? 1 : 0).map(x => manifest[x].filename).forEach(addFilename)
    addFilename(filename)
  }

  function addFilename(filename) {
    if (!sharedChunks.includes(filename)) {
      sharedChunks.push(filename)
    }
  }
}

function toScripts(filename, index) {
  return <script key={`javascript_${index}`} defer src={__webpack_public_path__ + filename} />
}
