#!/usr/bin/env node

console.log('----------------------------------------------------------------------------------------------')
console.log('`DeprecationWarning: loaderUtils.parseQuery()` will be solved when babel-loader 7 is released.')
console.log('----------------------------------------------------------------------------------------------')

const path = require('path')
const webpack = require('webpack')
const fs = require('fs-extra')
const ReactDOMServer = require('react-dom/server')
const { SourceMapConsumer } = require('source-map')
const walkSync = require('walk-sync')

const target = path.resolve(process.cwd(), 'target')
fs.removeSync(target)

const templateDir = path.resolve(process.cwd(), 'templates')

const templates = walkSync(templateDir, { globs: ['**/*.html.js'] }).reduce(
	(result, template) => (result[template] = path.resolve(templateDir, template), result),
	{}
)

try {
	const compiler = webpack({
		entry: templates,
		output: { filename: '[name]', path: target, libraryTarget: 'commonjs2' },
		externals: ['react'],
		resolve: { extensions: ['.js', '.html.js'] },
		devtool: 'source-map', // required for babel-loader to generate source maps
		module: {
			rules: [
				{
					test: /(\.html\.js|\.js)$/,
					loader: 'babel-loader',
	    		options: {
	    			babelrc: false, // this needs to be false, any other value will cause .babelrc to interfere with these settings
	    			presets: ['es2015', 'react'],
	    			plugins: ['add-module-exports']
	    		}
				}
			]
		},
		plugins: [
			new webpack.ProvidePlugin({ React: 'react' }),
			reactTemplatePlugin()
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

function reactTemplatePlugin() {
	return {
		apply: compiler => {
			compiler.plugin('emit', (compilation, done) => {
				process(compilation)
				done()
			})
		}
	}

	function process({ assets, errors }) {
		for (const name in assets) {
			if (templates[name]) {
				const asset = assets[name]
				delete assets[name]
				delete assets[name + '.map']

				const { result: html, error } = evalWithSourceMap(asset.source(), asset.map())

				if (error) errors.push(error)
				if (html) {
					const [baseName] = name.split('.')
					const result = ReactDOMServer.renderToStaticMarkup(html)
					assets[baseName + '.html'] = {
						source: () => result,
						size: () => result.length
					}
				}
			}
		}
	}
}

function evalWithSourceMap(source, map) {
	return withRawErrorStack(() => {
		try { return { result: eval(source) } }
		catch (e) { return { error: e + '\n' + toMappedStack(map, e.stack) } }
	})
}

function withRawErrorStack(fn) {
	const $prepareStackTrace = Error.prepareStackTrace
	Error.prepareStackTrace = (error, stack) => stack
	try { return fn() } finally { Error.prepareStackTrace = $prepareStackTrace }
}

function toMappedStack(map, stack) {
	const sourceMap = new SourceMapConsumer(map)
	return stack
		.map(frame => {
			if (frame.isEval()) {
				const generated = { line: frame.getLineNumber(), column: frame.getColumnNumber() - 1 }
				const { source, line, column } = sourceMap.originalPositionFor(generated)
				if (source && !source.startsWith('webpack/')) return `    at ${source}:${line}:${column + 1}`
			}
		})
		.filter(Boolean)
		.join('\n')
}
