module.exports = fragmentResolverPlugin

function fragmentResolverPlugin() {
  return {
    apply: resolver => {
      resolver.plugin('resolve', (request, callback) => {
        const innerRequest = request.request
        const [file, fragment] = (innerRequest && innerRequest.split('#')) || []
        if(file && fragment) {
          const newRequest = Object.assign({}, request, {
            request: file + '?fragment=' + fragment
          })
          resolver.doResolve('resolve', newRequest, 'resolving without fragment', callback, true)

        } else return callback()

      })
    }
  }
}
