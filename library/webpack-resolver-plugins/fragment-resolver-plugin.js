const p = 'fragment-resolver-plugin'

module.exports = fragmentResolverPlugin

function fragmentResolverPlugin() {
  return {
    apply: resolver => {
      resolver.hooks.resolve.tapAsync(p, (request, resolveContext, callback) => {
        const innerRequest = request.request
        const [file, fragment] = (innerRequest && innerRequest.split('#')) || []
        if (file && fragment) {
          const newRequest = Object.assign({}, request, {
            request: file + '?fragment=' + fragment
          })
          resolver.doResolve(resolver.hooks.resolve, newRequest, 'resolving without fragment', resolveContext, callback)

        } else return callback()

      })
    }
  }
}
