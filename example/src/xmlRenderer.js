const xml = require('xml')

module.exports = template => xml(template, { indent: true })
