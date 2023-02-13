const { relative } = require('path')
const config = require('@kaliber/config')
const { compileClientCode } = require('./universal/compileClientCode')

module.exports = containerlessUniversalServerLoader

/**
 * @this {import('webpack').LoaderContext<{
 *   outputOptions: Parameters<import('webpack').Compilation['createChildCompiler']>[1],
 *   plugins: Parameters<import('webpack').Compilation['createChildCompiler']>[2],
 * }>}
 */
function containerlessUniversalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const clientWrapper = get(config, 'kaliber.universal.clientWrapper')
  const serverWrapper = get(config, 'kaliber.universal.serverWrapper')

  // const { outputOptions, plugins } = this.getOptions()
  // const callback = this.async()

  // compileClientCode({
  //   entry: `./${filename}?containerless-universal-client`,
  //   id,
  //   parentCompilation: this._compilation,
  //   outputOptions,
  //   plugins,
  // })
  //   .then(({ entries, compilation }) => {
  //     // We probably need entries for manifest

  //     const code = createServerCode({ importPath, id, clientWrapper, serverWrapper })
  //     callback(null, code)
  //   })
  //   .catch(callback)
  return createServerCode({ importPath, id, clientWrapper, serverWrapper })
}

function createServerCode({
  importPath,
  id,
  serverWrapper: serverWrapperPath,
  clientWrapper: clientWrapperPath,
}) {
  const hasClientWrapper = Boolean(clientWrapperPath)
  const hasServerWrapper = Boolean(serverWrapperPath)

  return `
    import Component from './${importPath}?original'
    import assignStatics from 'hoist-non-react-statics'
    import { renderToString } from 'react-dom/server'
    import { ComponentServerWrapper } from '@kaliber/build/lib/universalComponents'
    ${hasServerWrapper ? `import ServerWrapper from '${serverWrapperPath}'` : ''}
    ${hasClientWrapper ? `import ClientWrapper from '${clientWrapperPath}'` : ''}

    assignStatics(WrappedForServer, Component)

    export default function WrappedForServer(props) {
      return ${wrap(hasServerWrapper, 'ServerWrapper', '<PropsWrapper serverProps={props} />')}
    }

    function PropsWrapper({ serverProps, ...additionalProps }) {
      const componentName = '${id}'
      const props = { ...additionalProps, ...serverProps }
      const renderedComponent = renderToString(
        ${wrap(hasClientWrapper, 'ClientWrapper', '<Component {...props} />')}
      )
      return <ComponentServerWrapper {...{ componentName, props, renderedComponent }} />
    }
  `
}

function wrap(condition, wrapper, body) {
  return condition
    ? `<${wrapper} {...props}>${body}</${wrapper}>`
    : body
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
