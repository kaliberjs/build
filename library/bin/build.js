#!/usr/bin/env node --icu-data-dir=./node_modules/full-icu

const checkInternationalization = require('../lib/checkInternationalization')
checkInternationalization()

const build = require('../lib/build')
build({ watch: false })
