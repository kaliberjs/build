const { relative } = require('path')
const DllEntryPlugin = require('webpack/lib/DllEntryPlugin')
const walkSync = require('walk-sync')

module.exports = function loadDirectoryPlugin(path) {

  return {
    apply: compiler => {

      const entryContext = relative(compiler.context, path)

      const entries = walkSync(path, { directories: false }).map(entry => `./${entryContext}/${entry}`)

      compiler.apply(new DllEntryPlugin(compiler.context, entries, 'public_entry'))

      compiler.plugin('emit', ({ assets }, done) => {
        delete assets['public_entry']
        delete assets['public_entry.map']
        done()
      })
    }
  }
}