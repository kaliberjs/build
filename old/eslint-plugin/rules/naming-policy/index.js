const {
  getPropertyName,
  getFunctionName,
  getParentJSXElement,
  hasParentsJSXElementsWithClassName, isInJSXBranch, isInExport,
} = require('../../machinery/ast')
const { isApp, isPage, getBaseFilename } = require('../../machinery/filename')
const { firstLetterLowerCase } = require('../../machinery/word')

const messages = {
  'invalid className': (found, expected) =>
    `Unexpected className '${found}', expected '${expected}'`,

  'no root className': found =>
    `Unexpected className '${found}', only root nodes can have a className that starts with 'app', ` +
    `'page' or 'component'`,

  'invalid component name': (found, expected) =>
    `Unexpected component name '${found}', expected '${expected}'`,

  'invalid css file name': (found, expected) =>
    `Unexpected css file name '${found}', expected '${expected}'`,

  'invalid styles variable name': (found, expected) =>
    `Unexptected css import name '${found}', expected '${expected}'`,

  'no styles properties with _': found =>
    `Unexpected underscore in '${found}', properties of styles can not start with an underscore - ` +
    `if you exported using @value switch to ':export { ... }'`,

  'ref should end with Ref': (found, exptected) =>
    `Unexpected ref name '${found}', expected '${exptected}'`,
}

module.exports = {
  messages,

  meta: { type: 'problem' },

  create(context) {
    const elementsWithValidRootElementClassName = new Set()

    return {
      [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
        const jsxElement = getParentJSXElement(node)

        const { property } = node
        if (hasParentsJSXElementsWithClassName(jsxElement) || isInJSXBranch(jsxElement))
          reportUnexpectedRootName(property)
        else
          reportInvalidRootElementClassName(jsxElement, property)
      },
      [`ExportDefaultDeclaration > FunctionDeclaration`](node) {
        reportInvalidFunctionName(node, { suggestFilename: true })
      },
      [`ExportNamedDeclaration > FunctionDeclaration`](node) {
        reportInvalidFunctionName(node, { suggestFilename: false })
      },
      [`ImportDeclaration[specifiers.0.local.name = 'styles']`](node) {
        reportInvalidCssFileName(node)
      },
      [`ImportDeclaration`](node) {
        reportInvalidStyleVariableName(node)
      },
      [`MemberExpression[object.name = 'styles']`](node) {
        reportUnderscoreProperties(node)
      },
      [`VariableDeclarator > .init Identifier[name=/^use.*Ref$/]`](node) {
        reportInvalidRefName(node)
      },
    }

    function reportInvalidCssFileName(node) {
      const source = node.source.value
      if (!source.endsWith('.css')) return

      const name = getBaseFilename(context)
      const expected = `./${name}.css`
      if (source === expected) return

      context.report({
        message: messages['invalid css file name'](source, expected),
        node: node.source,
      })
    }

    function reportInvalidStyleVariableName(node) {
      const source = node.source.value
      if (!source.endsWith('.css')) return

      const filename = getBaseFilename(context)
      const mainCss = `./${filename}.css`
      if (source !== mainCss) return

      const [firstSpecifier] = node.specifiers
      const specifier = firstSpecifier.local
      const { name } = specifier
      const expected = 'styles'
      if (name === expected) return

      context.report({
        message: messages['invalid styles variable name'](name, expected),
        node: specifier,
      })
    }

    function reportUnderscoreProperties(node) {
      const { property } = node
      const name = getPropertyName(property)

      if (!name.startsWith('_') || name.startsWith('_root')) return

      context.report({
        message: messages['no styles properties with _'](name),
        node: property
      })
    }

    function reportInvalidRootElementClassName(jsxElement, property) {
      const expectedClassNames = getValidRootElementClassNames(context)

      const className = getPropertyName(property)
      if (expectedClassNames.includes(className)) {
        elementsWithValidRootElementClassName.add(jsxElement)
        return
      }
      if (
        elementsWithValidRootElementClassName.has(jsxElement) &&
        !['component', 'app', 'page'].some(x => className.startsWith(x))
      ) return

      const [common, withRoot = common] = expectedClassNames
      const expected = className.includes('root') ? withRoot : common
      context.report({
        message: messages['invalid className'](className, expected),
        node: property,
      })
    }

    function reportUnexpectedRootName(property) {
      const className = getPropertyName(property)
      const forbidden = ['app', 'page', 'component']
      if (!forbidden.some(x => className.startsWith(x))) return

      context.report({
        message: messages['no root className'](className),
        node: property,
      })
    }

    function reportInvalidFunctionName(node, { suggestFilename }) {
      const { name } = node.id
      if (firstLetterLowerCase(name)) return

      const expectedPrefix = getBaseFilename(context)
      if (name.startsWith(expectedPrefix)) return

      const expected = suggestFilename ? expectedPrefix : `${expectedPrefix}${name}`
      context.report({
        message: messages['invalid component name'](name, expected),
        node: node.id,
      })
    }

    function reportInvalidRefName(node) {
      const parent = getParentOfType(node, 'VariableDeclarator')
      if (!parent) return

      const { id } = parent
      if (id.name.endsWith('Ref')) return
      context.report({
        message: messages['ref should end with Ref'](id.name, `${id.name}Ref`),
        node: id,
      })
    }
  }
}

function getValidRootElementClassNames(context) {
  const prefix = new RegExp(`^${getBaseFilename(context)}`)
  const name = getFunctionName(context).replace(prefix, '')
  const exported = isInExport(context)
  return (
    exported && isApp(context) ? [`app${name}`] :
    exported && isPage(context) ? [`page${name}`] :
    [`component${name}`, `component_root${name}`]
  )
}

function getParentOfType(node, type) {
  if (!node || node.type === type) return node
  return getParentOfType(node.parent, type)
}
