#!/usr/bin/env kaliber-node

require('../lib/checkInternationalization')

const build = require('../lib/build')
build({ watch: false })
