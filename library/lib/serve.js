const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const { access } = require('fs')
const { parsePath } = require('history')
const { resolve } = require('path')
const morgan = require('morgan')

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
const publicPathDir = publicPath.slice(1)
const index = 'index.html'
const indexWithRouting = 'index.html.js'
const notFound = '404.html'
const internalServerError = '500.html'

const port = process.env.PORT
const isProduction = process.env.NODE_ENV === 'production'

const notCached = ['html', 'txt', 'json', 'xml']

if (isProduction) app.use(morgan('combined'))
// hsts-headers are sent by our loadbalancer
app.use(helmet(Object.assign({ hsts: false, contentSecurityPolicy: false }, helmetOptions)))
app.use(compression())
app.set('trust proxy', true)
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
  resolveFile(req, res, next).catch(next)
})

app.use((err, req, res, next) => {
  if (!err) return next()

  console.error(err)
  const response = res.status(500)
  if (isProduction) {
    findFile(req.path, internalServerError)
      .then(file => file ? response.sendFile(file) : next())
      .catch(next)
  } else response.send(`<pre>${err.toString()}</pre>`)
})

app.listen(port, () => console.log(`Server listening at port ${port}`))

async function resolveFile(req, res, next) {
  try {
    const { path } = req
    /** @type {Array<[string, (file:any) => any]>} */
    const combinations = [
      [indexWithRouting, file => serveIndexWithRouting(req, res, file)],
      [notFound, file => res.status(404).sendFile(file)],
      [index, file => res.status(200).sendFile(file)],
    ]

    const dirs = possibleDirectories(path)
    for (const dir of dirs) {
      for (const [file, handler] of combinations) {
        const filePath = resolve(dir, file)
        if (await fileExists(filePath)) return handler(filePath)
      }
    }

    next()
  } catch (e) {
    next(e)
  }
}

async function findFile(path, file) {
  const dirs = possibleDirectories(path)
  for (path of dirs) {
    const filePath = resolve(path, file)
    if (await fileExists(filePath)) return filePath
  }
  return null
}

async function fileExists(path) {
  return isProduction
    ? (!fileExists.cache || fileExists.cache[path] === undefined)
      ? accessFile(path).then(exists => (addPathToCache(path, exists), exists))
      : fileExists.cache[path]
    : accessFile(path)

  function addPathToCache(path, exists) {
    fileExists.cache = Object.assign({}, fileExists.cache, { [path]: exists })
  }
}

async function accessFile(path) {
  return new Promise(resolve => access(path, err => resolve(!err)))
}

function possibleDirectories(path) {
  const pathSections = path.split('/').filter(Boolean)
  const possibleDirectories = []
  let sectionCount = pathSections.length
  do {
    possibleDirectories.push(resolve(...[target, publicPathDir, ...pathSections.slice(0, sectionCount)]))
  } while (sectionCount--)
  return possibleDirectories
}

function serveIndexWithRouting(req, res, file) {
  const envRequire = isProduction ? require : require('import-fresh')
  const template = envRequire(file)

  const routes = template.routes
  const location = parsePath(req.url)

  return Promise.resolve(routes)
    .then(routes => (routes && routes.match(location, req)) || { status: 200, data: null })
    .then(({ status, headers, data }) =>
      Promise.resolve(template({ location, data })).then(html => [status, headers, html])
    )
    .then(([ status, headers, html ]) => res.status(status).set(headers).send(html))
}
