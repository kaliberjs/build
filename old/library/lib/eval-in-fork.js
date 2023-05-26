const fs = require('fs-extra')
const path = require('path')
const uuid = require('uuid')

attempt(() => {
  process.on('message', handleMessage)

  function handleMessage(source) {
    attempt(() => {
      process.off('message', handleMessage)
      const { template, renderer } = evalSource(source)
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

function evalSource(source) {
  const file = path.resolve(`.kaliber-eval`, `${uuid.v4()}.js`)
  fs.outputFileSync(file, source, { encoding: 'utf-8' })
  try { return require(file) } finally { fs.removeSync(file) }
}
