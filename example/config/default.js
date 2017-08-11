const basicAuth = require('express-basic-auth')

module.exports = {
  client: {
    someConfigKey: true
  },
  thisConfigKeyShouldNotAppearInTheClient: true,

  kaliber: {
    serveMiddleware: ['/protected', basicAuth({
      challenge: true,
      users: {
        'admin': 'secret'
      }
    })]
  }
}
