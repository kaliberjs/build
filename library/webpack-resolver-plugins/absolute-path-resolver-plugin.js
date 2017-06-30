module.exports = absolutePathResolverPlugin

function absolutePathResolverPlugin(path) {
  return {
    apply: resolver => {
      resolver.plugin('resolve', (request, callback) => {
        const innerRequest = request.request
        if(innerRequest && innerRequest.startsWith('/')) {
          const newRequest = Object.assign({}, request, {
            path: path,
            request: './' + innerRequest.slice(1)
          })
          resolver.doResolve('resolve', newRequest, 'looking for file in ' + path, callback, true)

        } else return callback()

      })
    }
  }
}
