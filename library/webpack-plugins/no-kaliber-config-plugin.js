const p = 'no-kaliber-config-plugin'

module.exports = function noKaliberConfigPlugin() {
  return {
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler) {
      // provide a friendly error if @kaliber/config is loaded
      compiler.hooks.normalModuleFactory.tap(p, normalModuleFactory => {
        normalModuleFactory.hooks.afterResolve.tap(p, data => {
          const { rawRequest } = data.createData

          if (rawRequest === '@kaliber/config') throw new Error(
            '@kaliber/config\n' +
            '------\n' +
            'You can not load @kaliber/config from this module.\n' +
            '\n' +
            'If you have a use-case, please open an issue so we can discuss how we can\n' +
            'implement this safely.\n' +
            '------'
          )
        })
      })
    }
  }
}
