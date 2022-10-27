const helmet = require('helmet')

module.exports = helmet.contentSecurityPolicy.getDefaultDirectives()
