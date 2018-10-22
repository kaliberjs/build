const { getPolyfillString } = require('polyfill-service')
const pathname = '/polyfill.js'
const pathnameMinified = '/polyfill.min.js'

export default function withPolyfill(Wrapped) {
  WithPolyfill.routes = {
    match: async (location, request) => {
      const uaString = request.get('User-Agent')

      if ([pathname, pathnameMinified].includes(location.pathname)) {
        const minify = location.pathname === pathnameMinified
        return polyfillResponse({ uaString, query: request.query, minify })
      }

      if (Wrapped.routes) {
        const { status, headers, data: originalData } = await Wrapped.routes.match(location, request)
        return { status, headers, data: { uaString, originalData }}
      }

      return { status: 200, data: null }
    }
  }

  function WithPolyfill({ location, data: { polyfill, uaString, originalData }, ...props }) {
    return polyfill || <Wrapped {...props} location={location} data={originalData} polyfill={getPolyfill} />

    function getPolyfill(features = [], { minify = true } = {}) {
      const path = minify ? pathnameMinified : pathname
      return (<script defer src={`${path}?features=${features.join(',')}&cache=${encodeURIComponent(uaString)}`} />)
    }
  }

  return WithPolyfill
}


async function polyfillResponse({uaString, minify, query = {} }) {
  const features = (query.features || '').split(',').filter(Boolean).reduce((res, x) => ({ ...res, [x]: { flags: ['gated'] }}), {})
  const cache = !!query.cache

  const polyfill = await getPolyfillString({ uaString, minify, features })
  const headers = {
    'Content-Type': 'application/javascript;charset=utf-8',
    'Content-Length': polyfill.length,
    ...cache && { 'Cache-Control': 'max-age=31536000' }, // 365 days
  }

  return {
    status: 200,
    headers,
    data: { polyfill, uaString }
  }
}
