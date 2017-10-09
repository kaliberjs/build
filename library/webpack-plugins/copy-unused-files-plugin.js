/*
  Determines all files processed by webpack and copies all remaining files to the target directory
*/

const fs = require('fs-extra')
const path = require('path')
const walkSync = require('walk-sync')

module.exports = function copyUnusedFilesPlugin() {
  return {
    apply: compiler => {

      compiler.plugin('after-emit', (compilation, done) => {

        const context = compiler.context

        // for stats
        const chunk = {
          name: 'unused file',
          ids: ['_'],
          files: []
        }
        compilation.chunks.push(chunk)

        const filesCopied = Promise.all(
          walkSync(context).map(filePath => {
            const source = path.resolve(context, filePath)

            if (compilation.fileDependencies.includes(source)) return

            const target = path.resolve(compiler.options.output.path, filePath)
            return stat(source)
              .then(stats => {
                if (stats.isDirectory()) return
                if (compilation.assets[filePath]) throw new Error(`Unexpected problem: ${filePath} is marked as unused but it is in the compilation assets - create an issue with an example to reproduce and we will figure out a solution`)

                const asset = compilation.assets[filePath] = {
                  size: () => stats.size,
                  emitted: false
                }
                chunk.files.push(filePath)

                return copy(source, target)
                  .then(_ => { asset.emitted = true })
              })
          })
        )

        filesCopied.then(_ => { done() }).catch(done)
      })
    }
  }
}

function copy(source, target) {
  return new Promise((resolve, reject) => {
    fs.copy(source, target, err => { err ? reject(err) : resolve() })
  })
}

function stat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => { err ? reject(er) : resolve(stats) })
  })
}
