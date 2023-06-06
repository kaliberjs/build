import head from '/partials/head'

Index.routes = {
  resolveIndex({ pathname }) {
    return (
      pathname === '/routeBasedTemplate/test1' ? 'routeBasedTemplate/template1' :
      pathname === '/routeBasedTemplate/test2' ? 'routeBasedTemplate/template2' :
     null
    )
  },

  async match({ pathname }, request) {
    return { status: 200, data: { hostname: request.hostname, pathname } }
  }
}

export default function Index({ data }) {
  return (
    <html lang='en'>
      {head('Fallback')}
      <body>
        Fallback
        <p>{JSON.stringify(data)}</p>
      </body>
    </html>
  )
}
