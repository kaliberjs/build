module.exports = commonChunksPlugin

// we should probably exclude entry.js stuff
// on the other hand we have no production use cases (I think) for entries. I am unsure if they will be
// combined with normal usage. And if there are multiple entries sharing the same modules, I'm sure we
// would want to extract the commons from them as well.
function commonChunksPlugin() {

  return {
    apply: compiler => {
      compiler.plugin('compilation', compilation => {

        compilation.plugin('optimize-chunks', chunks => {

          // determine the usage of modules
          const moduleUsage = chunks.reduce(
            (result, chunk) => chunk.getModules().reduce(
              (result, module) => {
                const chunks = result.get(module) || []
                chunks.push(chunk)

                return result.set(module, chunks)
              },
              result
            ),
            new Map()
          )

          // determine the chunks we need to make
          const newChunks = Array.from(moduleUsage.entries()).reduce(
            (result, [module, chunks]) => {
              if (chunks.length === 1) return result

              const newChunk = 'commons (' + chunks.map(chunk => chunk.name).join(', ') + ')'

              const { modules } = result[newChunk] || (result[newChunk] = { chunks, modules: [] })
              modules.push(module)
              return result
            },
            {}
          )

          // create the new chunks
          Object.keys(newChunks).forEach(chunkName => {

            const newChunk = compilation.addChunk(chunkName)
            newChunk.filenameTemplate = '[id].[hash].js'

            const { chunks, modules } = newChunks[chunkName]

            // move the modules
            modules.forEach(module => {

              // remove module from old chunks
              chunks.forEach(chunk => { chunk.removeModule(module) })

              // add module to new chunk
              newChunk.addModule(module)
              module.addChunk(newChunk)
            })

            // connect old and new chunks
            chunks.forEach(chunk => {
              const parents = chunk.parents || []
              parents.push(newChunk)
              newChunk.addChunk(chunk)

              chunk.entrypoints.forEach(entrypoint => { entrypoint.insertChunk(newChunk, chunk) })
            })
          })

          return false
        })
      })
    }
  }
}
