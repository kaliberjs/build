#!/usr/bin/env node

console.log('----------------------------------------------------------------------------------------------')
console.log('`DeprecationWarning: loaderUtils.parseQuery()` will be solved when babel-loader 7 is released.')
console.log('----------------------------------------------------------------------------------------------')

const path = require('path')
const webpack = require('webpack')
const fs = require('fs-extra')
const walkSync = require('walk-sync')

const mergeCssPlugin = require('../webpack-plugins/merge-css-plugin')
const reactTemplatePlugin = require('../webpack-plugins/react-template-plugin')
const reactUniversalPlugin = require('../webpack-plugins/react-universal-plugin')
const sourceMapPlugin = require('../webpack-plugins/source-map-plugin')

const target = path.resolve(process.cwd(), 'target')
fs.removeSync(target)

const templateDir = path.resolve(process.cwd(), 'templates')

const templates = walkSync(templateDir, { globs: ['**/*.html.js'] }).reduce(
  (result, template) => (
    result[template.replace('.html.js', '')] = './' + template, result),
  {}
)

try {
  const compiler = webpack({
    entry: templates,
    output: { 
      filename: '[name]', 
      path: target, 
      libraryTarget: 'umd2' //'commonjs2' 
    },
    externals: {
      react: {
        commonjs2: 'react',
        root: 'React'
      }, 
      'react-dom': {
        commonjs2: 'react-dom',
        root: 'ReactDOM'
      }, 
      'react-dom/server': {
        commonjs2: 'react-dom/server'
      }
    },
    resolve: { extensions: ['.js', '.html.js'] },
    resolveLoader: {
      modules: [path.resolve(__dirname, '../webpack-loaders'), "node_modules"]
    },
    context: templateDir,
    module: {
      rules: [
        {
          test: /\.css$/,
          loaders: ['json-loader', 'css-loader']
        },
        {
          test: /(\.html\.js|\.js)$/,
          loaders: [
            {
              loader: 'babel-loader',
              options: {
                babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
                presets: ['es2015', 'react'],
                plugins: ['add-module-exports', 'transform-class-properties']
              }
            },
            {
              loader:'react-universal-support'
            }
          ]
        }
      ]
    },
    plugins: [
      new webpack.ProvidePlugin({ React: 'react', Component: ['react', 'Component'] }),
      sourceMapPlugin(),
      reactTemplatePlugin(templates),
      reactUniversalPlugin(),
      mergeCssPlugin()
    ]
  })

  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err)
      if (err.details) console.error(err.details)
      return
    }

    console.log(stats.toString({ colors: true }))
  })
} catch (e) { console.error(e.message) }
