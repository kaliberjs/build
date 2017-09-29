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

          removeSmallChunks(newChunkInfo, { minSize: 10000 /* 10K */ })

          const newChunks = addChunks(compilation, Object.keys(newChunkInfo))
          newChunks.forEach(newChunk => {

            const { chunks, modules } = newChunkInfo[newChunk.name]

            moveModules(modules, { sources: chunks, target: newChunk })

            createHierarchy({ parent: newChunk, children: chunks })

            removeRuntimes(chunks)
          })

          if (newChunks.length) {
            addRuntimes(compilation, newChunks)

            dubbelCheckRuntimes(newChunks)
          }

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

      const newChunkName = `commons (${chunks.map(c => c.name).join(', ')})`

      const chunkInfo = result[newChunkName]
      if (chunkInfo) chunkInfo.modules.push(module)
      else result[newChunkName] = { chunks, modules: [module] }

      return result
    },
    {}
  )
}

function removeSmallChunks(newChunkInfo, { minSize }) {
  Object.keys(newChunkInfo).forEach(newChunkName => {
    const { modules } = newChunkInfo[newChunkName]

    const size = modules.reduce((result, module) => result + module.size(), 0)
    if (size < minSize) delete newChunkInfo[newChunkName]
  })
}

function addChunks(compilation, chunkNames) {
  return chunkNames.map(chunkName =>
    addChunk(compilation, chunkName, { addRuntime: false })
  )
}

function addChunk(compilation, name, { addRuntime }) {
  const newChunk = compilation.addChunk(name)
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

  const runtimeChunkName = `common runtime (${shared.map(c => c.name).join(', ')})`
  const runtimeChunk = addChunk(compilation, runtimeChunkName, { addRuntime: true })
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
      newChunks.forEach(newChunk => {
        const previousShareCount = result.get(newChunk) || 0
        const newShareCount = newChunks.length

        if (newShareCount > previousShareCount) result.set(newChunk, newShareCount)
      })
      return result
    },
    new Map()
  )
}

/*
  This function is not strictly necessary but allows us to, more easily catch edge cases
  and changes to the webpack internals.

  With this function we check if each original chunk that was affected by this module
  has exactly 1 runtime in it's 'chunk-chain'
*/
function dubbelCheckRuntimes(newChunks) {
  const affectedChunks = determineAffectedChunks(newChunks)
  /*
    affectedChunks = Map(
      [chunk]: [newChunk1, ..., newChunkN]
    )
  */
  Array.from(affectedChunks.entries()).forEach(
    ([chunk, newChunks]) => {

      if (chunk.hasRuntime()) error(
        `Optimized chunk (${chunk.name}) has a runtime while it uses ${newChunks.length} shared chunks`
      )

      const newChunksWithRuntime = newChunks.filter(newChunk => newChunk.hasRuntime())
      if (newChunksWithRuntime > 1) error(
        `More than one shared chunk (used by a single chunk), ${newChunksWithRuntime.length} to be exact,\n` +
        `has a runtime:\n` +
        `${newChunksWithRuntime.map(c => c.name).join(', ')}`
      )

      if (newChunksWithRuntime === 0) {
        newChunks.reduce(
          (previousParent, newChunk) => {
            const parent = newChunk.parent

            if (!parent.hasRuntime()) error(
              `Shared chunk (${newChunk.name}) does not have a runtime and it's parent (${parent.name}) does not have\n` +
              `one either.`
            )

            if (previousParent && previousParent !== parent) error(
              `Shared chunk (${newChunk.name}) does not have a runtime and it's parent (${parent.name}) is different\n` +
              `from the parent of the previous shared chunk (${previousParent.name}). This means the chunk (${chunk.name})\n` +
              `has more than one runtime.`
            )

            return parent
          },
          null
        )
      }
    }
  )

  function error(message) {
    throw new Error(
      `You have found an implementation problem in the CommonChunksPlugin of @kaliber/build.\n` +
      `This error means one of two things:\n` +
      `- Webpack has changed it's internals and we need to check the changes to make this plugin\n` +
      `  work again.\n` +
      `- You have found a situation that we did not foresee when writing this plugin\n` +
      `\n` +
      `* In both cases it would be awesome if you were to create an issue. *\n` +
      `\n` +
      `Extra information for the developers:\n` +
      message
    )
  }
}
