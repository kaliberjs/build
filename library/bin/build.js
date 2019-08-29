const checkInternationalization = require('../lib/checkInternationalization')
checkInternationalization()

const build = require('../lib/build')
build({ watch: false })
