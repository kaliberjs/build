const path = require('path')
const log = require('loglevel')
const config = require('@kaliber/config')

const logLevel = log.levels[process.env.LOG_LEVEL]
if (logLevel) log.setDefaultLevel(logLevel)

const cwd = process.cwd()
const srcDir = path.resolve(cwd, 'src')
const targetDir = path.resolve(cwd, 'target')

const {
  // compileWithBabel: userDefinedcompileWithBabel = [],
  publicPath = '/',
  // symlinks = true,
  // webpackLoaders: userDefinedWebpackLoaders = [],
} = config.kaliber || {}
const outputPath = path.join(targetDir, publicPath)

const nodeConfig = require('./lib/webpack/webpack.node.config')
const browserConfig = require('./lib/webpack/webpack.browser.config')

const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development'

module.exports = [
  nodeConfig({ mode, srcDir, log, cwd, publicPath, outputPath }),
  browserConfig({ mode, srcDir, log, cwd, publicPath, outputPath }),
]
