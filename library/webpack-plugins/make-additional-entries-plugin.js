const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency')
const { createDependency } = require('webpack/lib/SingleEntryPlugin')

module.exports = makeAdditionalEntries

/*
  Provides a custom plugin-hook that allows other plugins to hook into a specific moment
  during the make stage that is after the entries (from the config) have been loaded but
  before make is complete.

  This allows other plugins to 'make' things with information from the initial entries.

  Usage from other plugins:

  compiler.plugin('make-additional-entries', (compilation, createEntries, done) => {

    // if you want to add new entries
    createEntries({ name: path }, done)

    // If you don't want to create entries
    done()

    // when you need to signal an error
    done(err)
  })
*/

function makeAdditionalEntries() {
  return {
    apply: compiler => {

      const entriesToMake = {}

      // claim the entries in the `entry` if it's object shaped and allow
      // other plugins to claim certain entries
      // any leftover entries are added using this plugin
      compiler.plugin("entry-option", (context, entries) => {
        if(typeof entries === "object" && !Array.isArray(entries)) {
          const originalEntries = Object.assign({}, entries)
          Object.assign(entriesToMake, compiler.applyPluginsWaterfall('claim-entries', originalEntries))
          return true
        }
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        // make sure the SingleEntryDependency has a factory
        compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)
      })

      compiler.plugin('make', (compilation, done) => {

        addEntries(entriesToMake)
          .then(makeAdditionalEntries)
          .then(_ => { done() })
          .catch(e => { done(e) })

        function makeAdditionalEntries() {
          return new Promise((resolve, reject) => {
            compiler.applyPluginsAsyncSeries(
              'make-additional-entries',
              compilation,
              (entries, done) => { addEntries(entries || {}).then(_ => { done() }).catch(done) },
              err => { err ? reject(err) : resolve() }
            )
          })
        }

        function addEntries(entries) {
          return Promise.all(Object.keys(entries).map(name => addEntry(name, entries[name])))
        }

        function addEntry(name, path) {
          return new Promise((resolve, reject) => {
            const entry = createDependency(path, name)
            compilation.addEntry(compiler.context, entry, entry.loc, err => err ? reject(err) : resolve())
          })
        }
      })
    }
  }
}
