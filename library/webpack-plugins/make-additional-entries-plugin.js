/*
  Provides a custom plugin-hook that allows other plugins to hook into a specific moment
  during the make stage that is after the entries (from the config) have been loaded but
  before make is complete.

  This allows other plugins to 'make' things with information from the initial entries. An
  example of this is the React universal plugin which catches `?universal` in order to
  render the client side version.

  Usage from other plugins:

  compiler.hooks.makeAdditionalEntries.tapAsync('plugin-name', (compilation, createEntries, done) => {

    // if you want to add new entries
    createEntries({ name: path }, done)

    // If you don't want to create entries
    done()

    // when you need to signal an error
    done(err)
  })

  and

  compiler.hooks.claimEntries.tap('plugin-name', entries => {
    return unclaimedEntries
  })
*/

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
const { AsyncSeriesHook, SyncWaterfallHook } = require('tapable')
const { createDependency } = require('webpack/lib/SingleEntryPlugin')

const p = 'make-additional-entries'

module.exports = function makeAdditionalEntries() {
  return {
    apply: compiler => {

      if (compiler.hooks.claimEntries) throw new Error('Hook `claimEntries` already in use')
      compiler.hooks.claimEntries = new SyncWaterfallHook(['entries'])
      if (compiler.hooks.makeAdditionalEntries) throw new Error('Hook `makeAdditionalEntries` already in use')
      compiler.hooks.makeAdditionalEntries = new AsyncSeriesHook(['compilation', 'addEntries'])

      const entriesToMake = {}

      /*
        claim the entries in the `entry` if it's object shaped and allow other plugins
        to claim certain entries, any leftover entries are added using this plugin
      */
      compiler.hooks.entryOption.tap(p, (context, entries) => {
        if (typeof entries === 'object' && !Array.isArray(entries)) {
          const originalEntries = Object.assign({}, entries)
          Object.assign(entriesToMake, compiler.hooks.claimEntries.call(originalEntries))
          return true
        }
      })

      // make sure the SingleEntryDependency has a factory
      compiler.hooks.compilation.tap(p, (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)
      })

      /*
        Create the gathered entries and apply the `make-additional-entries` plugins
        Note that plugins can depend on entries created in plugins registered
        before them.
      */
      compiler.hooks.make.tapPromise(p, compilation => {

        return addEntries(entriesToMake)
          .then(makeAdditionalEntries)

        function makeAdditionalEntries() {
          return compiler.hooks.makeAdditionalEntries.promise(compilation, addEntries)
        }

        function addEntries(entries) {
          return Promise.all(Object.keys(entries).map(name => addEntry(name, entries[name])))
        }

        function addEntry(name, path) {
          return new Promise((resolve, reject) => {
            const entry = createDependency(path, name)
            compilation.addEntry(compiler.context, entry, name, err => err ? reject(err) : resolve())
          })
        }
      })
    }
  }
}
