const { resolve } = require('path')
const { Router } = require('express')
const contentSecurityPolicy = require('./contentSecurityPolicy')

const router = Router()
router.get('/test2', function(req, res, next) {
  const target = resolve(process.cwd(), 'target')
  const test = resolve(target, 'test/test.html.js')
  delete require.cache[require.resolve(test)]
  const template = require(test)

  res.send(template())
})

module.exports = {
  serveMiddleware: router,
  assetURL: 'http://images.here',
  kaliber: {
    helmetOptions: {
      contentSecurityPolicy: {
        directives: {
          ...contentSecurityPolicy,
          'script-src-elem': [
            `'self'`,
            // (req, res) => `'nonce-${res.locals.requestNonce}'`,
            `'sha256-yBUfDl2lLpn2oAfohahhMNE8Y9t9fWa9N8Cp7K7jfNE='`, // stylesheet
            `'sha256-AiPuncf2KTdBkPzaEwtfo74PB8Epu4Z/d22BNgTRK7o='`, // universal components
            `'sha256-hWbkXxK//w+jkG6k+YLqx8Km5DGxMu74g/vy/Y9N+UA='`, // rollbar (project dependent)
            'https://cdn.polyfill.io/',
            'https://cdn.rollbar.com/rollbarjs/',
            'https://*.firebaseio.com/',
          ],
          'connect-src': [
            `'self'`,
            'ws://localhost:*',
            'https://*.firebaseio.com/',
            'wss://*.firebaseio.com/',
          ],
          'frame-src': [
            'https://*.firebaseio.com/'
          ]
        }
      }
    },
  }
}
