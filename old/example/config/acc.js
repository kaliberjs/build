const basicAuth = require('express-basic-auth')

module.exports = {
  kaliber: {
    serveMiddleware: basicAuth({
      challenge: true,
      realm: 'example',
      users: {
        'admin': 'secret'
      }
    })
  }
}
