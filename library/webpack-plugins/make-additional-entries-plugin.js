/*
  Provides a custom plugin-hook that allows other plugins to hook into a specific moment
  during the make stage that is after the entries (from the config) have been loaded but
  before make is complete.

  This allows other plugins to 'make' things with information from the initial entries. An
  example of this is the React universal plugin which catches `?universal` in order to
  render the client side version.

  Usage from other plugins:

  makeAdditionalEntries.getHooks(compiler).additionalEntries.tap('plugin-name', () => {
    return entries
  })

  and

  makeAdditionalEntries.getHooks(compiler).afterAdditionalEntries.tap('plugin-name', (compilation) => {
    ...
  })
*/

const EntryDependency = require('webpack/lib/dependencies/EntryDependency')
const { AsyncSeriesHook, SyncWaterfallHook, AsyncHook, Hook, AsyncParallelHook, SyncHook, SyncBailHook } = require('tapable')
const { createDependency } = require('webpack/lib/SingleEntryPlugin')
const { createGetHooks } = require('../lib/webpack-utils')
const { EntryOptionPlugin, EntryPlugin } = require('webpack')

const p = 'make-additional-entries'

const getHooks = createGetHooks(() => ({
  additionalEntries: new SyncBailHook(),
  /** @type {AsyncParallelHook<[import('webpack').Compilation]>} */
  afterAdditionalEntries: new AsyncParallelHook(['compiler']),
}))
makeAdditionalEntries.getHooks = getHooks

module.exports = makeAdditionalEntries // rename to entries

function makeAdditionalEntries() {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply: compiler => {
      const hooks = getHooks(compiler)

      const entriesToMake = {}

      /* Claim the entries in the `entry` */
      compiler.hooks.entryOption.tap(p, (context, entries) => {
        Object.assign(entriesToMake, entries)
        return true
      })

      // make sure the EntryDependency has a factory
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(EntryDependency, normalModuleFactory)
      })

      /*
        Create the gathered entries and apply the `make-additional-entries` plugins
        Note that plugins can depend on entries created in plugins registered
        before them.
      */
      compiler.hooks.make.tapPromise(p, async compilation => {
        await addEntries(entriesToMake)

        const additionalEntries = hooks.additionalEntries.call()
        if (additionalEntries) await addEntries(additionalEntries)

        await hooks.afterAdditionalEntries.promise(compilation)

        async function addEntries(entries) {
          return Promise.all(Object.entries(entries).map(([name, entry]) => addEntry(name, entry)))
        }

        async function addEntry(name, entry) {
          // TODO: misschien kunnen we de DynamicEntryPlugin gebruiken. Die lijkt hier heel erg op
          const options = EntryOptionPlugin.entryDescriptionToOptions(compiler, name, entry)
          for (const path of entry.import) {
            await new Promise((resolve, reject) => {
              compilation.addEntry(
                compiler.context,
                EntryPlugin.createDependency(path, options),
                options,
                err => {
                  if (err) reject(err)
                  else resolve()
                }
              )
            })
          }
        }
      })
    }
  }
}
