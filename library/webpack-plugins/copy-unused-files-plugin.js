/*
  Determines all files processed by webpack and copies all remaining files to the target directory
*/

const fs = require('fs-extra')
const path = require('path')
const walkSync = require('walk-sync')

const p = 'copy-unused-files-plugin'

module.exports = function copyUnusedFilesPlugin() {
  return {
    apply: compiler => {

      compiler.hooks.afterEmit.tapPromise(p, compilation => {

        const context = compiler.context

        // for stats
        const chunk = {
          name: 'unused file',
          ids: ['_'],
          files: /** @type {Array<string>} */([])
        }
        compilation.chunks.push(chunk)

        const filesCopied = Promise.all(
          walkSync.entries(context).map(entry => {
            const source = entry.fullPath

            if (compilation.fileDependencies.has(source)) return null

            const filePath = entry.relativePath
            const target = path.resolve(compiler.options.output.path, filePath)
            if (entry.isDirectory()) return null
            if (compilation.assets[filePath]) throw new Error(`Unexpected problem: ${filePath} is marked as unused but it is in the compilation assets - create an issue with an example to reproduce and we will figure out a solution`)

            const asset = compilation.assets[filePath] = {
              size: () => entry.size,
              emitted: false
            }
            chunk.files.push(filePath)

            return copy(source, target)
              .then(_ => { asset.emitted = true })
          })
        )

        return filesCopied
      })
    }
  }
}

/** @returns {Promise<void>} */
function copy(source, target) {
  return new Promise((resolve, reject) => {
    fs.copy(source, target, { preserveTimestamps: true }, err => { err ? reject(err) : resolve() })
  })

}
