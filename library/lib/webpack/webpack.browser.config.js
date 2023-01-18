const { findEntries } = require('./findEntries')

module.exports = ({ mode, srcDir, log }) => ({
  name: 'browser-compiler',
  mode,
  context: srcDir,
  target: 'web',

  async entry() {
    const entries = await findEntries({
      cwd: srcDir,
      patterns: [
        '**/*.entry.js',
      ]
    })

    log.info(`Building the following entries (web):`)
    Object.keys(entries).forEach(entry => log.info(`  - ${entry}`))

    return entries
  },

  output: {
    filename: '[id].[contenthash].js',
    chunkFilename: '[id].[contenthash].js',
  }
})
