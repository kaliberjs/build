const compression = require('compression')
const express = require('express')
const helmet = require('helmet').default
const { access } = require('fs')
const { parsePath } = require('history')
const { resolve } = require('path')
const morgan = require('morgan')

const templateRenderers = require('./getTemplateRenderers')

const { kaliber: { serveMiddleware, helmetOptions, publicPath = '/', reportError } = {} } = require('@kaliber/config')

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

const envRequire = isProduction ? require : require('import-fresh')

const notCached = ['html', 'txt', 'json', 'xml']

const { contentSecurityPolicy, ...helmetOptionsToUse } = helmetOptions || {}
const cspMiddleware = contentSecurityPolicy && createCspMiddleware(contentSecurityPolicy)
const [sendHtmlFunction, sendHtmlFunctionIsAsync] = cspMiddleware
  ? [sendHtmlWithCspHeaders, true]
  : [sendHtml, false]

if (isProduction) app.use(morgan('combined'))
app.use(helmet(Object.assign(
  {
    hsts: false, // hsts-headers are sent by our loadbalancer
    contentSecurityPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  },
  helmetOptionsToUse
)))
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
  if (err.status && err.status >= 400 && err.status < 500)
    return res.status(err.status).send()

  reportServerError(err, req)
  serveInternalServerError(err, { req, res, next })
})

app.listen(port, () => console.log(`Server listening at port ${port}`))

async function resolveFile(req, res, next) {
  try {
    const { path } = req
    /** @type {Array<[string, (file:any) => any]>} */
    const combinations = [
      [indexWithRouting, file => serveIndexWithRouting(file, req, res, next)],
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

function fileExists(path) {
  return isProduction
    ? (!fileExists.cache || fileExists.cache[path] === undefined)
      ? accessFile(path).then(exists => (addPathToCache(path, exists), exists))
      : fileExists.cache[path]
    : accessFile(path)

  function addPathToCache(path, exists) {
    fileExists.cache = Object.assign({}, fileExists.cache, { [path]: exists })
  }
}

function accessFile(path) {
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

function serveIndexWithRouting(file, req, res, next) {
  const routeTemplate = envRequire(file)

  const location = parsePath(req.url)

  const [dataOrPromiseFromTemplate, template] = getDataAndRouteTemplate(routeTemplate, location, req)

  const dataOrPromise =
    dataOrPromiseFromTemplate.then ? dataOrPromiseFromTemplate :
    sendHtmlFunctionIsAsync ? Promise.resolve(dataOrPromiseFromTemplate) :
    dataOrPromiseFromTemplate

  if (dataOrPromise.then)
    dataOrPromise
      .then(data => sendHtmlFunction(req, res, template, location, data))
      .catch(error => {
        reportServerError(error, req)
        serveInternalServerError(error, req, res, next)
      })
  else
    try {
      sendHtmlFunction(req, res, template, location, dataOrPromise)
    } catch (error) {
      reportServerError(error, req)
      serveInternalServerError(error, req, res, next)
    }
}

function getDataAndRouteTemplate(routeTemplate, location, req) {

  const routes = routeTemplate.routes
  const dataOrPromise = (routes && routes.match(location, req)) || { status: 200, data: null }

  if (!routes || !routes.resolveIndex)
    return [dataOrPromise, routeTemplate]

  const indexLocation = routes.resolveIndex(location, req)
  if (!indexLocation)
    return [dataOrPromise, routeTemplate]

  const indexPath = resolve(target, publicPathDir, indexLocation, indexWithRouting)
  return [dataOrPromise, envRequire(indexPath)]
}

function serveInternalServerError(error, req, res, next) {
  const response = res.status(500)
  if (isProduction) {
    findFile(req.path, internalServerError)
      .then(file => file ? response.sendFile(file) : next())
      .catch(next)
  } else response.send(`<pre><title style='display: block;'>${error.stack || error.toString()}</title><pre>`)
}

function reportServerError(error, req) {
  console.error(error)
  if (reportError) reportError(error, req)
}


async function sendHtml(req, res, template, location, { status, headers, data }) {
  const scriptHashes = new Set()
  const html = template({ location, data }, scriptHashes)
  res.status(status).set(headers).send(html)
}

async function sendHtmlWithCspHeaders(req, res, template, location, { status, headers, data }) {
  const scriptHashes = new Set()
  const html = template({ location, data }, scriptHashes)

  // make script hashes available for CSP middleware
  res.locals.scriptHashes = Array.from(scriptHashes).map(hash => `'sha256-${hash}'`)
  await addCspHeaders(req, res)

  res.status(status).set(headers).send(html)
}

function createCspMiddleware(contentSecurityPolicy) {
  const contentSecurityPolicyWithHashes = {
    ...contentSecurityPolicy,
    directives: {
      ...contentSecurityPolicy.directives,
      'script-src-elem': [
        ...contentSecurityPolicy.directives['script-src-elem'],
        (req, res) => res.locals.scriptHashes.join(' '),
      ]
    }
  }
  return helmet.contentSecurityPolicy(contentSecurityPolicyWithHashes)
}

function addCspHeaders(req, res) {
  return new Promise((resolve, reject) => {
    cspMiddleware(req, res, (e) => {
      if (e) reject(e)
      else resolve(undefined)
    })
  })
}

