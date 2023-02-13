const { relative } = require('path')
const { compileClientCode } = require('./universal/compileClientCode')

module.exports = universalServerLoader

/**
 * @this {import('webpack').LoaderContext<{
 *   outputOptions: Parameters<import('webpack').Compilation['createChildCompiler']>[1],
 *   plugins: Parameters<import('webpack').Compilation['createChildCompiler']>[2],
 * }>}
 */
function universalServerLoader(source, map) {
  const filename = relative(this.rootContext, this.resourcePath)
  const importPath = relative(this.context, this.resourcePath)
  const id = filename.replace(/[/.]/g, '_')

  // const { outputOptions, plugins } = this.getOptions()
  // const callback = this.async()

  // compileClientCode({
  //   entry: `./${filename}?universal-client`,
  //   id,
  //   parentCompilation: this._compilation,
  //   outputOptions,
  //   plugins,
  // })
  //   .then(({ entries, compilation }) => {
  //     // We probably need entries for manifest

  //     const code = createServerCode({ importPath, id })
  //     callback(null, code)
  //   })
  //   .catch(callback)
  // return createServerCode({ importPath, id })
  return createServerCode({ importPath, id })
}

// TODO: Check if we still need the `hoist-non-react-statics`
function createServerCode({ importPath, id }) {
  return `
    import Component from './${importPath}'
    import assignStatics from 'hoist-non-react-statics'
    import { renderToString } from 'react-dom/server'

    assignStatics(WrapWithScript, Component)

    export default function WrapWithScript({ universalContainerProps, ...props }) {
      const content = renderToString(<Component {...props} />)
      return (
        <div {...universalContainerProps} data-componentid='${id}' data-props={JSON.stringify(props)} dangerouslySetInnerHTML={{ __html: content }} />
      )
    }
  `
}
