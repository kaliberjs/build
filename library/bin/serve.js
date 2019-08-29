#!/bin/sh
":" //# comment; exec /usr/bin/env node --icu-data-dir="$( node -e 'process.stdout.write(require(`path`).dirname(require.resolve(`full-icu`)))' )" "$0" "$@"

const checkInternationalization = require('../lib/checkInternationalization')
checkInternationalization()

require('../lib/serve')
