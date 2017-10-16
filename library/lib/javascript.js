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
    addParents(manifest[name].parents)
  })

  return sharedChunks.map(toScripts)

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

function toScripts(filename, index) {
  return <script key={`javascript_${index}`} defer src={__webpack_public_path__ + filename} />
}
