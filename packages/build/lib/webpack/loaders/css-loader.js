import path from 'node:path'
import crypto from 'node:crypto'
import postcss from 'postcss'

// We can combine all module related npm modules to improve performance
import postcssModulesLocalByDefault from 'postcss-modules-local-by-default'
import postcssModulesScope from 'postcss-modules-scope'
import { postcssModulesExports } from './css-loader/postcss-plugins/postcssModulesExports.js'
import { nameFromPattern } from './css-loader/nameFromPattern.js'

const isProduction = process.env.NODE_ENV === 'production'

/**
 * @typedef {{}} CssLoaderOptions
 */

/** @type {import('webpack').LoaderDefinitionFunction} */
export default async function cssLoader(source) {
  /** @type {import('webpack').LoaderContext<CssLoaderOptions>} */
  const loaderContext = this

  const filename = path.relative(this.rootContext, this.resourcePath)
  const callback = this.async()

  /** @type {postcss.ProcessOptions} */
  const postCssOptions = {
    map: { inline: false, annotation: false },
    from: this.resourcePath,
    to  : this.resourcePath,
  }
  const postCssPlugins = getPlugins({ context: loaderContext.context })

  try {
    const result = await postcss(postCssPlugins).process(source, postCssOptions)
    throwErrorForWarnings(filename, result.warnings())

    const { exports } = handleMessages(result.messages)

    const { css, map } = result
    loaderContext.emitFile(filename, css, /** @type {any} */ (map.toJSON()))
    const cssHash = crypto.createHash('sha1').update(css).digest('hex')
    callback(null, `module.exports = ${JSON.stringify({ ...exports, cssHash })}`)
  } catch (e) {
    callback(e)
  }
}

function getPlugins({ context }) {
  return [
    postcssModulesLocalByDefault,
    postcssModulesScope({
      generateScopedName(name, path) {
        return nameFromPattern({
          pattern: /* TODO isProduction ? '[contenthash]' :*/ '[folder]-[name]-[local]__[contenthash]',
          name,
          resourcePath: path,
          context,
        })
      }
    }),
    postcssModulesExports(),
  ]
}

function throwErrorForWarnings(filename, warnings) {
  if (!warnings.length) return

  const message = warnings
    .sort(({ line: a = 0 }, { line: b = 0 }) => a - b)
    .map(warning => `${fileAndLine(warning)}\n\n${warning.text}`)
    .join('\n\n')

  throw new Error(`${message}\n`)

  function fileAndLine({ line }) {
    return `${filename}${line ? `:${line}` : ''}`
  }
}

function handleMessages(messages) {
  const { exports } = messages.reduce(
    ({ exports }, message) => {
      if (message.type === 'export')
        return { exports: { ...exports, [message.item.key]: message.item.value }}
      else
       throw new Error(`Unknown message type ${message.type}:\n${JSON.stringify(message, null, 2)}`)
    },
    { exports: {} }
  )

  return { exports }
}
