module.exports = commonChunksPlugin

/*
  Chunks, entrypoints and the runtime.

  You can safely skip this until you encounter a line drawn with '='' tokens.

  This is a tricky topic (mainly because of the weird implementation) so I'll write it down in hopes I
  will understand it.

  There is this concept of 'preparedChunks' in the compilation. These are filled by calls to `addEntry`
  which is done during the `make` phase (by for example the `entry` configuration).

  During the `seal` phase these `preparedChunks` are converted into chunks (by `addChunk`). At this point
  an `Entrypoint` with the name of the chunk is created. And the chunk is 'unshifted' into the entrypoint.
  'unshift' here means:
    - add the chunk at the front of the chunks array of the entry point
    - add the entry point at the end of the entrypoints of the chunk

  So, once this is done we have the following structure:

  Chunk #1
    - name: 'somename'
    - entrypoints: [
      Entrypoint #1
        - name: 'somename',
        - chunks: [Chunk #1]
    ]

  If you would ask this chunk: do you have a runtime? It would say: yes, because I am the first chunk in
  the first entrypoint.

  If you would ask this chunk: are you initial? It would say: yes, because I have entrypoints

  Oh, the use of initial is a bit unclear, it seems to have an effect on the file name if the chunk has no
  `filenameTemplate`. If this is the case, initial means use the outputOptions.filename otherwise use
  outputOptions.chunkFilename.

  If a chunk has a runtime it means it's rendered using the main template instead of the chunk template. This
  however does not guarantee a runtime (also called bootstrap internally). There is one more thing required
  for a chunk to be rendered with a runtime: chunk.chunks must have at least one chunk. These are added to the
  chunk using the `addChunk` method in `Chunk`. To me it's unclear when this happens with with 'normal' chunks.

  Anyway, from the CommonsChunkPlugin I learned which steps to take in order move around modules between chunks.

    1. Gather the modules that need to be moved
    2. Create a chunk to move them to
    3. Move the module (parent/child relation)
    4. Connect the chunks (parent/child relation)
    5. Adjust the entrypoints

  1, 2, 3* and 4** are fairly sraightforward.

  * Moving a module to a chunk is a three step process:
    1. Remove the module from a chunk
    2. Add the module to a chunk
    3. Add the chunk to a module

  ** Adding a chunk(1) to a chunk(2) is a two step process, my guess is that this is used to signal a dependency:
    1. Add the chunk(2) as a parent to the chunk(1)
    2. Add a chunk(1) to the chunk(2)

  5 on the other other hand is kinda tricky. Entrypoints seem to be only used to determine if a chunk is initial
  or if it has a runtime. The CommonsChunkPlugin calls `insertChunk` on each entrypoint it stole modules from.
  This has the effect that it will appear as the first chunk in the entrypoints of the chunk that the modules were
  stolen from and that the entrypoint itself is added to the chunk. Yeah I know: mindboggling.

  Netto effect is that the newly created chunk has an entry point with itself as a first chunk (a runtime) and making
  sure the chunk it stole modules from is no longer the first entry point (no runtime). If a core member of the
  webpack team ever reads this: Please, refactor this stuff, it makes watching at the clock and understanding what time
  it is while under the influence of magic mushrooms look easy.

  In any case instead of using the magical `insertChunk` method, we could probably just `unshift` any value into the
  chunks property of the entry point, or even clear the chunks of the entry point.

  The entry point in the newly created chunk can just contain the chunk itself if it needs a runtime, if not it can be
  an array like this `[{ chunks: [] }]` to make sure it's initial.

  =======================================================================================================================

  In a few steps, this is what the plugin does:

  1. Gather all modules that are used in multiple chunks record the chunks that uses the modules

     Map(
       [module]: [chunk1, ..., chunkN]
     )

  2. Determine all the chunks that need to be created and the modules that should be in those chunks

     {
       'common (chunk1, ..., chunkN)': {
          chunks: [chunk1, ..., chunkN],
          modules: [module1, ..., moduleN]
       }
     }

  3. Create the new chunks and move the modules to the new chunks

     [
        Chunk {
          name: 'common (chunk1, ..., chunkN)',
          modules: [module1, ...., moduleN],
          chunks: [chunk1, ...., chunkN],
          entrypoints: [{ chunks: [] }]
        }
     ]

  4. Make sure the correct chunks get a runtime. Read the code to find out the details.
*/

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
          const newChunkInfo = Array.from(moduleUsage.entries()).reduce(
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
          const newChunks = Object.keys(newChunkInfo).map(newChunkName => {

            const newChunk = compilation.addChunk(newChunkName)
            newChunk.filenameTemplate = '[id].[hash].js'
            newChunk.entrypoints = [{ chunks: [] }] // no runtime in this chunk

            const { chunks, modules } = newChunkInfo[newChunkName]

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
              chunk.addParent(newChunk)
              newChunk.addChunk(chunk)

              chunk.entrypoints.forEach(entrypoint => {
                entrypoint.chunks.length = 0 // prevent the chunk from including a runtime
              })
            })

            return newChunk
          })

          // attach the new chunks as children to the masterChunk and make sure the masterChunk has a runtime
          if (newChunks.length) {

            // so we will change this with some smart algorithm to determine which chunks
            // need a runtime, for now it's good enough to introduce a single chunk with a runtime

            const masterChunk = compilation.addChunk('common runtime')
            masterChunk.filenameTemplate = '[id].[hash].js'
            masterChunk.entrypoints = [{ chunks: [masterChunk] }] // this chunk has a runtime

            newChunks.forEach(newChunk => {
              newChunk.addParent(masterChunk)
              masterChunk.addChunk(newChunk)
            })
          }

          return false
        })
      })
    }
  }
}
