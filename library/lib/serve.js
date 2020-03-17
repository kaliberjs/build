const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const { access } = require('fs')
const { parsePath } = require('history')
const { resolve } = require('path')

const templateRenderers = require('./getTemplateRenderers')

const { kaliber: { serveMiddleware, helmetOptions, publicPath = '/' } = {} } = require('@kaliber/config')

const recognizedTemplates = Object.keys(templateRenderers)
const blockedTemplateFiles = recognizedTemplates.reduce(
  (result, type) => [...result, `.*\\.${type}\\.js`, `.*\\.template\\.${type}\\.js`, `.*\\.template\\.${type}\\.js.map`],
  []
)
const blockedTemplatesRegex = new RegExp(`^(${blockedTemplateFiles.join('|')})$`)

const app = express()

const target = resolve(process.cwd(), 'target')
const dir = publicPath.slice(1)
const index = resolve(target, dir, 'index.html')
const indexWithRouting = resolve(target, dir, 'index.html.js')
const notFound = resolve(target, dir, '404.html')
const internalServerError = resolve(target, dir, '500.html')

const port = process.env.PORT
const isProduction = process.env.NODE_ENV === 'production'

const notCached = ['html', 'txt', 'json', 'xml']

// hsts-headers are sent by our loadbalancer
app.use(helmet(Object.assign({ hsts: false }, helmetOptions)))
app.use(compression())
app.set('trust proxy', false)
serveMiddleware && app.use(...[].concat(serveMiddleware))
app.use((req, res, next) => {
  if (blockedTemplatesRegex.test(req.path)) {
    res.status(404)
    res.send()
  } else next()
})
app.use(express.static(target, {
  maxAge: '1y',
  immutable: true,
  setHeaders: (res, path) => {
    if (notCached.some(x => path.endsWith('.' + x))) res.setHeader('Cache-Control', 'public, max-age=0')
  }
}))

app.use((req, res, next) => {
  fileExists(indexWithRouting)
    .then(fileFound => fileFound ? serveIndexWithRouting(req, res, next) : next())
    .catch(next)
})

app.use((req, res, next) => {
  fileExists(notFound)
    .then(fileFound => fileFound ? res.status(404).sendFile(notFound) : next())
    .catch(next)
})

app.use((req, res, next) => {
  fileExists(index)
    .then(fileFound => fileFound ? res.status(200).sendFile(index) : next())
    .catch(next)
})

app.use((err, req, res, next) => {
  if (!err) return next()

  console.error(err)
  const response = res.status(500)
  if (isProduction) {
    fileExists(internalServerError)
      .then(() => response.sendFile(internalServerError))
      .catch(next)
  } else response.send(`<pre>${err.toString()}</pre>`)
})

app.listen(port, () => console.log(`Server listening at port ${port}`))

function fileExists (path) {
  return isProduction
    ? (!fileExists.cache || fileExists.cache[path] === undefined)
      ? accessFile(path).then(fileFound => (addPathToCache(path, fileFound), fileFound))
      : Promise.resolve(fileExists.cache[path])
    : accessFile(path)

  function accessFile (path) {
    return new Promise(resolve => access(path, err => resolve(!err)))
  }

  function addPathToCache (path, fileFound) {
    fileExists.cache = Object.assign({}, fileExists.cache, { [path]: fileFound })
  }
}

function serveIndexWithRouting (req, res, next) {
  const envRequire = isProduction ? require : require('import-fresh')
  const template = envRequire(indexWithRouting)

  const routes = template.routes
  const location = parsePath(req.url)

  return Promise.resolve(routes)
    .then(routes => (routes && routes.match(location, req)) || { status: 200, data: null })
    .then(({ status, headers, data }) =>
      Promise.resolve(template({ location, data })).then(html => [status, headers, html])
    )
    .then(([ status, headers, html ]) => res.status(status).set(headers).send(html))
}
