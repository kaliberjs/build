import path from 'node:path'
import webpack from 'webpack'

export function nameFromPattern({ pattern, context, name, resourcePath }) {

  const content = path.relative(context, resourcePath) + '\x00' + name

  const parsed = path.parse(resourcePath)
  const directory = path.relative(context, parsed.dir)
  const folder = directory.length > 1 ? path.basename(directory) : ''

  const result = pattern
    .replace(/\[local\]/gi, name)
    .replace(/\[contenthash\]/gi, getHashDigest(content))
    .replace(/\[name\]/gi, parsed.name)
    .replace(/\[folder\]/gi, folder)
    .replace(/[^a-zA-Z0-9\-_\u00A0-\uFFFF]/g, '-')
    .replace(/^((-?[0-9])|--)/, '_$1')

  return result
}

function getHashDigest(buffer) {
  const algorithm = 'xxhash64'
  const hash = webpack.util.createHash(algorithm)
  hash.update(buffer)
  return hash.digest('hex')
}
