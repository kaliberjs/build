const eslintPluginImport = require('eslint-plugin-import')
const messages = require('./messages')

const { isApp, isPage, isTemplate, getBaseFilename } = require('./machinery/filename')
const {
  getPropertyName,
  getFunctionName,
  getJSXElementName, getParentJSXElement,
  isRootJSXElement, hasParentsJSXElementsWithClassName, isInJSXBranch
} = require('./machinery/ast')
const { firstLetterLowerCase } = require('./machinery/word')

module.exports = {
  messages,
  rules: {
    'root-class-name': {
      create(context) {
        const checked = new Set()

        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checked.has(jsxElement)) return
            else checked.add(jsxElement)

            const { property } = node
            if (
              hasParentsJSXElementsWithClassName(jsxElement) ||
              isInJSXBranch(jsxElement)
            ) noRootNameInChildren(property)
            else correctRootName(property)
          }
        }

        function correctRootName(property) {
          const prefix = new RegExp(`^${getBaseFilename(context)}`)
          const name = getFunctionName(context).replace(prefix, '')
          const expectedClassNames =
            isApp(context) ? [`app`] :
            isPage(context) ? [`page`] :
            [`component${name}`, `component_root${name}`]

          const className = getPropertyName(property)
          if (expectedClassNames.includes(className)) return

          const [common, withRoot = common] = expectedClassNames
          const expected = className.includes('root') ? withRoot : common
          context.report({
            message: messages['invalid className'](className, expected),
            node: property,
          })
        }

        function noRootNameInChildren(property) {
          const className = getPropertyName(property)
          const forbidden = ['app', 'page', 'component']
          if (!forbidden.some(x => className.startsWith(x))) return

          context.report({
            message: messages['no root className'](className),
            node: property,
          })
        }
      }
    },
    'no-custom-component-class-name': {
      create(context) {
        return {
          [`JSXSpreadAttribute Property[key.name = 'className']`]: noClassName,
          [`JSXAttribute[name.name = 'className']`]: noClassName,
        }

        function noClassName(node) {
          const jsxElement = getParentJSXElement(node)
          const name = getJSXElementName(jsxElement)

          if (firstLetterLowerCase(name) || name.endsWith('Base')) return

          context.report({
            message: messages['no className on custom component'],
            node,
          })
        }
      }
    },
    'no-export-base': {
      create(context) {
        return {
          'ExportNamedDeclaration > FunctionDeclaration'(node) {
            const { name } = node.id
            if (!name.endsWith('Base') || firstLetterLowerCase(name)) return

            const exportNode = node.parent
            context.report({
              message: messages['no export base'],
              node: exportNode,
              loc: {
                start: exportNode.loc.start,
                end: node.loc.start
              },
            })
          }
        }
      }
    },
    'child-no-layout-class-name': {
      create(context) {
        const checkedLayoutClassName = new Set()
        const foundRootReferences = new Map()

        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)

            if (!isRootJSXElement(jsxElement)) return

            const { property } = node
            const className = getPropertyName(property)
            if (!['_root', 'component_root'].some(x => className.startsWith(x))) return

            foundRootReferences.set(jsxElement, property)

            if (!checkedLayoutClassName.has(jsxElement)) return

            context.report({
              message: messages['no _root with layoutClassName'],
              node: property
            })
          },
          [`ReturnStatement JSXAttribute[name.name = 'className'] Identifier[name = 'layoutClassName']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checkedLayoutClassName.has(jsxElement)) return
            else checkedLayoutClassName.add(jsxElement)

            if (isRootJSXElement(jsxElement)) {
              if (!foundRootReferences.has(jsxElement)) return

              context.report({
                message: messages['no _root with layoutClassName'],
                node: foundRootReferences.get(jsxElement)
              })
              return
            }

            context.report({
              message: messages['no layoutClassName in child'],
              node,
            })
          }
        }
      }
    },
    'component-name-starts-with-file-name': {
      create(context) {
        return {
          'ExportDefaultDeclaration > FunctionDeclaration': nameStartsWithFilename({ suggestFilename: true }),
          'ExportNamedDeclaration > FunctionDeclaration': nameStartsWithFilename({ suggestFilename: false }),
        }

        function nameStartsWithFilename({ suggestFilename }) {
          return (node) => {
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
        }
      }
    },
    'force-css-file-name': {
      create(context) {
        return {
          [`ImportDeclaration[specifiers.0.local.name = 'styles']`](node) {
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
        }
      }
    },
    'force-css-variable-name': {
      create(context) {
        return {
          [`ImportDeclaration`](node) {
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
        }
      }
    },
    'force-jsx-spreaded-variable-passing': {
      create(context) {
        return {
          [`JSXAttribute`](node) {
            const { name } = node.name
            if (
              name === 'key' ||
              !node.value ||
              node.value.type !== 'JSXExpressionContainer' ||
              name !== node.value.expression.name
            ) return

            context.report({
              message: messages['incorrect variable passing'](name),
              node,
            })
          }
        }
      }
    },
    'force-destructured-props': {
      create(context) {
        return {
          [`FunctionDeclaration`](node) {
            const [props] = node.params
            if (firstLetterLowerCase(node.id.name) || !props || props.type !== 'Identifier') return
            context.report({
              message: messages['destructure props'],
              node: props,
            })
          }
        }
      }
    },
    'no-default-export': {
      create(context) {
        if (isApp(context) || isTemplate(context)) return {}
        return eslintPluginImport.rules['no-default-export'].create(context)
      }
    },
    'no-underscore-styles': {
      create(context) {
        return {
          [`MemberExpression[object.name = 'styles']`](node) {
            const { property } = node
            const name = getPropertyName(property)

            if (!name.startsWith('_') || name.startsWith('_root')) return

            context.report({
              message: messages['no styles with _'](name),
              node: property
            })
          }
        }
      }
    },
    'no-relative-parent-import': {
      create(context) {
        return {
          'ImportDeclaration': checkSource,
          'ExportNamedDeclaration': checkSource,
          'ExportAllDeclaration': checkSource,
        }

        function checkSource({ source }) {
          if (!source) return
          const { value } = source
          if (!value.includes('..')) return

          context.report({
            message: messages['no relative parent import'](value),
            node: source
          })
        }
      }
    }
  }
}

