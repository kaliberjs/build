attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(locations) {
    attemptAsync(async () => {
      const rendererModule = await import(locations.renderer)
      const templateModule = await import(locations.template)

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

function attemptAsync(f) {
  attempt(() =>
    f().catch(e => {
      console.error(e)
      process.exit(1)
    })
  )
}
