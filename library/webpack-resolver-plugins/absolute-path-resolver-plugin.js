const p = 'absolute-path-resolver-plugin'

module.exports = absolutePathResolverPlugin

function absolutePathResolverPlugin(path) {
  return {
    apply: resolver => {
      resolver.hooks.resolve.tapAsync(p, (request, resolveContext, callback) => {
        const innerRequest = request.request
        if (innerRequest && innerRequest.startsWith('/')) {
          const newRequest = Object.assign({}, request, {
            path: path,
            request: './' + innerRequest.slice(1)
          })
          resolver.doResolve(resolver.hooks.resolve, newRequest, 'looking for file in ' + path, resolveContext, callback, true)

        } else return callback()

      })
    }
  }
}
