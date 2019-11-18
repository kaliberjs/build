const { evalWithSourceMap, withSourceMappedError } = require('./node-utils')

const [,, source, map] = process.argv

const createMap = () => JSON.parse(map)
const { template, renderer } = evalWithSourceMap(source, createMap)

try {
  console.log(withSourceMappedError(createMap, () => renderer(template)))
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
}
