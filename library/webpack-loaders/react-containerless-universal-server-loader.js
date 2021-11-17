const { relative } = require('path')

module.exports = ReactContainerlessUniversalServerLoader

function ReactContainerlessUniversalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')
  const clientWrapper = get(require('@kaliber/config'), 'kaliber.universal.clientWrapper')
  const serverWrapper = get(require('@kaliber/config'), 'kaliber.universal.serverWrapper')
  return createServerCode({ importPath, id, clientWrapper, serverWrapper })
}

function createServerCode({
  importPath,
  id,
  serverWrapper: serverWrapperPath,
  clientWrapper: clientWrapperPath,
}) {
  const client = wrap({
    importPath: clientWrapperPath,
    wrapperName: 'ClientWrapper',
    component: '<Component {...props} />',
  })

  const server = wrap({
    importPath: serverWrapperPath,
    wrapperName: 'ServerWrapper',
    component: '<PropsWrapper serverProps={props} />',
  })

  return `|import Component from './${importPath}?original'
          |import assignStatics from 'hoist-non-react-statics'
          |import { renderToString } from 'react-dom/server'
          |import { ComponentServerWrapper } from '@kaliber/build/lib/universalComponents'
          |${server.wrapper}
          |${client.wrapper}
          |
          |assignStatics(WrappedForServer, Component)
          |
          |export default function WrappedForServer(props) {
          |  return ${server.wrapped}
          |}
          |
          |function PropsWrapper({ serverProps, ...additionalProps }) {
          |  const componentName = '${id}'
          |  const props = { ...additionalProps, ...serverProps }
          |  const renderedComponent = renderToString(${client.wrapped})
          |  return <ComponentServerWrapper {...{ componentName, props, renderedComponent }} />
          |}
          |`.replace(/^[\s]*\|/mg, '')
}

function wrap({ wrapperName, component, importPath }) {
  return {
    wrapper: importPath ? `import ${wrapperName} from '${importPath}'` : '',
    wrapped: importPath ? `<${wrapperName} {...props}>${component}</${wrapperName}>` : component,
  }
}

function get(o, path) {
  return path.split('.').reduce((result, key) => result && result[key], o )
}
