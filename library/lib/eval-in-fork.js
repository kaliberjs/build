attempt(() => {
  const { evalWithSourceMap, withSourceMappedError } = require('./node-utils')

  const messages = []
  process.on('message', handleMessage)
  function handleMessage(x) {
    attempt(() => {
      messages.push(x)
      const [source, map] = messages
      if (source !== undefined && map !== undefined) {
        const createMap = () => map
        const { template, renderer } = evalWithSourceMap(source, createMap)
        const result = withSourceMappedError(createMap, () => renderer(template))
        process.send(result)
        process.off('message', handleMessage)
        process.exit()
      }
    })
  }
})

function attempt(f) {
  try {
    f()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
