#!/usr/bin/env node --icu-data-dir=./node_modules/full-icu

const checkInternationalization = require('../lib/checkInternationalization')
checkInternationalization()

require('../lib/serve')
