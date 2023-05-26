#!/usr/bin/env node

import config from '../lib/webpack.config.js'
import webpack from 'webpack'

webpack(config, (e, stats) => {
  if (e) {
    console.error(e)
    process.exit(2)
    return
  }

  if (stats) console.log(stats.toString(config.stats))

  process.exit(stats?.hasErrors() ? 1 : 0)
})
