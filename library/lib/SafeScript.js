const crypto = require('crypto')
const React = require('react')

module.exports = { SafeScript, recordScriptHashes }

function SafeScript({ dangerouslySetInnerHTML }) {
  if (!global.scriptHashes) throw new Error('No script hashes present')
  global.scriptHashes.add(crypto.createHash('sha256').update(dangerouslySetInnerHTML.__html).digest('base64'))
  return React.createElement('script', { dangerouslySetInnerHTML })
}

function recordScriptHashes(newScriptHashses, callback) {
  global.scriptHashes = newScriptHashses
  const result = callback()
  global.scriptHashes = null
  return result
}
