const crypto = require('crypto')
const React = require('react')

let scriptHashes = null

module.exports = { SafeScript, recordScriptHashes }

function SafeScript({ dangerouslySetInnerHTML }) {
  if (!scriptHashes) throw new Error('No script hashes present')
  scriptHashes.add(crypto.createHash('sha256').update(dangerouslySetInnerHTML.__html).digest('base64'))
  return React.createElement('script', { dangerouslySetInnerHTML })
}

function recordScriptHashes(newScriptHashses, callback) {
  scriptHashes = newScriptHashses
  const result = callback()
  scriptHashes = null
  return result
}
