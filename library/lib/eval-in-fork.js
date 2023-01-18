attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(locations) {
    attempt(() => {
      const rendererModule = require(locations.renderer)
      const templateModule = require(locations.template)
      const renderer = rendererModule.default || rendererModule
      const template = templateModule.default || templateModule

      const result = renderer(template)

      process.send(result, e =>
        attempt(() => {
          if (e) throw e
          else process.exit()
        })
      )
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
