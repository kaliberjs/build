const { resolve } = require('path')
const { Router } = require('express')

const router = Router()
router.get('/test2', function(req, res, next) {
  const target = resolve(process.cwd(), 'target')
  const test = resolve(target, 'test/test.html.js')
  delete require.cache[require.resolve(test)]
  const template = require(test)

  res.send(template())
})

module.exports = {
  kaliber: {
    serveMiddleware: router,
    templateRenderers: {
      xml: '/xmlRenderer',
      mjml: '/mjml-renderer'
    }
  },
  assetURL: 'http://images.here'
}
