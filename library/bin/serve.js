#!/usr/bin/env node

const compression = require('compression')
const express = require('express')
const helmet = require('helmet')
const { access } = require('fs')
const { parsePath } = require('history/PathUtils')
const { resolve } = require('path')

const { kaliber: { serveMiddleware } = {} } = (process.env.CONFIG_ENV ? require('@kaliber/config') : {})

const app = express()

const target = resolve(process.cwd(), 'target')
const index = resolve(target, 'index.html.js')
const notFound = resolve(target, '404.html')
const internalServerError = resolve(target, '500.html')

const port = process.env.PORT
const isProduction = process.env.NODE_ENV === 'production'

app.use(helmet())
app.use(compression())
serveMiddleware && app.use(serveMiddleware)
app.use(express.static(target))
app.use((req, res, next) => fileExists(index)
  .then(() => serveIndex(req, res, next))
  .catch(() => next())
)
app.use((req, res, next) => fileExists(notFound)
  .then(() => res.status(404).sendFile(notFound))
  .catch(() => next())
)

app.listen(port, () => console.log(`Server listening at port ${port}`))

function fileExists(path) {
  return new Promise((resolve, reject) => access(path, err => err ? reject() : resolve()))
}

function serveIndex (req, res, next) {
  if (!isProduction) delete require.cache[require.resolve(index)]
  const template = require(index)

  const routes = template.routes
  const location = parsePath(req.url)

  Promise.resolve(routes)
    .then(routes => routes && routes.match(location, req) || { status: 200, data: null })
    .then(({ status, data }) => template({ location, data }).then(html => [status, html]))
    .then(([ status, html ]) => res.status(status).send(html))
    .catch(e => {
      console.error(e)
      const response = res.status(500)
      fileExists(internalServerError)
        .then(() => response.sendFile(internalServerError))
        .catch(() => response.send('Internal Server Error'))
    })
}
