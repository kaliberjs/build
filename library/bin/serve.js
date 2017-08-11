#!/usr/bin/env node

const express = require('express')
const { parsePath } = require('history/PathUtils')
const { resolve } = require('path')
const { accessSync } = require('fs')

const { kaliber: { serveMiddleware } = {} } = (process.env.CONFIG_ENV ? require('@kaliber/config') : {})

const app = express()

const target = resolve(process.cwd(), 'target')
const index = resolve(target, 'index.html.js')
const notFound = resolve(target, '404.html')
const internalServerError = resolve(target, '500.html')

const port = process.env.PORT

serveMiddleware && app.use(serveMiddleware)
app.use(express.static(target))
app.use((req, res, next) => {
  if (!fileExists(index)) return next()

  if (process.env.NODE_ENV !== 'production') delete require.cache[require.resolve(index)]
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
      if (!fileExists(internalServerError)) response.send('Internal Server Error')
      else response.sendFile(internalServerError)
    })
})
app.use((req, res, next) => {
  if (!fileExists(notFound)) return next()
  res.status(404).sendFile(notFound)
})

app.listen(port, () => console.log(`Server listening at port ${port}`))

function fileExists(path) {
  try { return (accessSync(path), true) } catch (_) { return false }
}
