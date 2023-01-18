const p = 'kaliber.AbsolutePathResolverPlugin'

module.exports = { AbsolutePathResolverPlugin }

function AbsolutePathResolverPlugin({ path }) {
  return {
    /** @param {import('webpack').Resolver} resolver */
    apply(resolver) {
      resolver.hooks.resolve.tapAsync(p, (request, resolveContext, callback) => {
        const innerRequest = request.request
        if (innerRequest && innerRequest.startsWith('/')) {
          const newRequest = Object.assign({}, request, {
            path,
            request: './' + innerRequest.slice(1)
          })
          resolver.doResolve(resolver.hooks.resolve, newRequest, 'looking for file in ' + path, resolveContext, callback)

        } else return callback()

      })
    }
  }
}
