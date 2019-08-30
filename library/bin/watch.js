#!/usr/bin/env kaliber-node

const checkInternationalization = require('../lib/checkInternationalization')
checkInternationalization()

const build = require('../lib/build')
build({ watch: true })
