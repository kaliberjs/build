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
    createEntries({ name: path })

    // when you are done
    done()

    // when you need to signal an error
    done(err)
  })
*/

function makeAdditionalEntries() {
  return {
    apply: compiler => {

      const originalEntries = {}

      // claim and record the entries in the `entry` if it's object shaped
      compiler.plugin("entry-option", (context, entry) => {
        if(typeof entry === "object" && !Array.isArray(entry)) {
          Object.assign(originalEntries, entry)
          return true
        }
      })

      compiler.plugin('compilation', (compilation, { normalModuleFactory }) => {
        // make sure the SingleEntryDependency has a factory
        compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory)
      })

      compiler.plugin('make', (compilation, done) => {

        addEntries(originalEntries)
          .then(makeAdditionalEntries)
          .then(addEntries)
          .then(_ => { done() })
          .catch(e => { done(e) })

        function makeAdditionalEntries() {
          return new Promise((resolve, reject) => {
            const additionalEntries = {}
            compiler.applyPluginsParallel(
              'make-additional-entries',
              compilation,
              entries => { Object.assign(additionalEntries, entries) },
              err => { err ? reject(err) : resolve(additionalEntries) }
            )
          })
        }

        function addEntries(entries = {}) {
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
