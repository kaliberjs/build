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

          const moduleUsage = determineModuleUsage(chunks)
          /*
            moduleUsage = Map(
              [module]: [chunk1, ..., chunkN]
            )
          */

          const newChunkInfo = determineNewChunks(moduleUsage)
          /*
            newChunkInfo = {
              'newChunkName': {
                chunks: [chunk1, ..., chunkN],
                modules: [module1, ..., moduleN]
              }
            }
          */

          const newChunks = addChunks(compilation, Object.keys(newChunkInfo))

          newChunk.forEach(newChunk => {

            const { chunks, modules } = newChunkInfo[newChunk.name]

            moveModules(modules, { sources: chunks, target: newChunk })

            createHierarchy({ parent: newChunk, children: chunks })

            removeRuntimes(chunks)
          })

          if (newChunks.length) addRuntimes(compilation, newChunks)

          // we could use this instead of the `addRuntimes` function
          // const runtimeChunk = addChunk(compilation, 'common runtime', { addRuntime: true })
          // createHierarchy({ parent: runtimeChunk, children: newChunks })

          return false
        })
      })
    }
  }
}

function determineModuleUsage(chunks) {
  return chunks.reduce(
    (result, chunk) => {
      chunk.getModules().forEach(module => {
        const chunks = result.get(module)
        if (chunks) chunks.push(chunk)
        else result.set(module, [chunk])
      })
      return result
    },
    new Map()
  )
}

function determineNewChunks(moduleUsage) {
  return Array.from(moduleUsage.entries()).reduce(
    (result, [module, chunks]) => {
      if (chunks.length === 1) return result // ignore modules that are included in only one chunk

      const newChunkName = 'commons (' + chunks.map(chunk => chunk.name).join(', ') + ')'

      const chunkInfo = result[newChunkName]
      if (chunkInfo) chunkInfo.modules.push(module)
      else result[newChunkName] = { chunks, modules: [module] }

      return result
    },
    {}
  )
}

function addChunks(compilation, chunkNames) {
  return chunkNames.map(newChunkName =>
    addChunk(compilation, newChunkName, { addRuntime: false })
  )
}

function addChunk(compilation, name, { addRuntime }) {
  const newChunk = compilation.addChunk(newChunkName)
  newChunk.filenameTemplate = '[id].[hash].js'
  newChunk.entrypoints = [{ chunks: addRuntime ? [newChunk] : [] }] // no runtime in this chunk
  return newChunk
}

function moveModules(modules, { sources, target }) {
  modules.forEach(module => {
    sources.forEach(chunk => { chunk.removeModule(module) })
    target.addModule(module)
    module.addChunk(target)
  })
}

function createHierarchy({ parent, children }) {
  children.forEach(chunk => {
    chunk.addParent(parent)
    parent.addChunk(chunk)
  })
}

function removeRuntimes(chunks) {
  chunks.forEach(chunk => {
    chunk.entrypoints.forEach(entrypoint => {
      entrypoint.chunks.length = 0 // prevent the chunk from including a runtime
    })
  })
}

function addRuntimes(compilation, newChunks) {
  if (newChunks.length === 1) return addRuntime(newChunks[0])

  const affectedChunks = determineAffectedChunks(newChunks)
  /*
    affectedChunks = Map(
      [chunk]: [newChunk1, ..., newChunkN]
    )
  */

  const chunkWithAllChunks = newChunks.find(({ chunks }) => chunks.length === affectedChunks.size)
  if (chunkWithAllChunks) return addRuntime(chunkWithAllChunks)


  const { exclusive, shared } = determineCoverage(newChunks, affectedChunks)
  exclusive.forEach(addRuntime)

  if (!shared.length) return

  const runtimeChunk = addChunk(compilation, 'common runtime', { addRuntime: true })
  createHierarchy({ parent: runtimeChunk, children: shared })
}

function addRuntime(chunk) {
  chunk.entrypoints = [{ chunks: [chunk] }]
}

function determineAffectedChunks(newChunks) {
  return newChunks.reduce(
    (result, newChunk) => {
      newChunk.chunks.forEach(chunk => {
        const newChunks = result.get(chunk)
        if (newChunks) newChunks.push(newChunk)
        else result.set(chunk, [newChunk])
      })
      return result
    },
    new Map()
  )
}

function determineCoverage(newChunks, affectedChunks) {
  const shareCount = determineShareCounts(newChunks, affectedChunks)
  /*
    shareCount = Map(
      [newChunk]: 0
    )
  */

  return newChunks.reduce(
    ({ exclusive, shared }, newChunk) => {
      const isExclusive = shareCount.get(newChunk) === 1

      if (isExclusive) exclusive.push(newChunk)
      else shared.push(newChunk)

      return { exclusive, shared }
    },
    { exclusive: [], shared: [] }
  )
}

function determineShareCounts(newChunks, affectedChunks) {
  return Array.from(affectedChunks.values()).reduce(
    (result, newChunks) => {
      const previousShareCount = result.get(newChunk) || 0
      const newShareCount = newChunks.length

      return newShareCount > previousShareCount)
        ? result.set(newChunk, newShareCount)
        : result
    },
    new Map()
  )
}
