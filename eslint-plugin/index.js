const path = require('path')

const messages = {
  'invalid className': expected => `invalid className\n\nexpected '${expected}'`,
  'no component className': `invalid className\n\nonly root nodes can have a className that starts with 'component'`,
  'no className': 'className is not allowed on custom components\n\nonly native (lower case) elements can have a className',
  'no export base': 'base components can not be exported\n\nremove the `export` keyword',
  'no layoutClassName': 'layoutClassName can not be used on child components\n\nset the layoutClassName as the className of the root node',
  'invalid component name': expected => `invalid component name\n\nexpected '${expected}'`,
  'invalid css file name': expected => `invalid css file name\n\nexpected '${expected}'`,
}
module.exports = {
  messages,
  rules: {
    // Test.js -> import notStyles from './Test.css'
    'root-component-class-name': {
      create(context) {
        const checked = new Set()

        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checked.has(jsxElement)) return
            else checked.add(jsxElement)

            if (!isRootJSXElement(jsxElement)) return
            const expected = `component${getFunctionName(context)}`
            if (node.property.name === expected) return

            context.report({
              message: messages['invalid className'](expected),
              node: node.property,
            })
          }
        }
      }
    },
    'child-no-component-class-name': {
      create(context) {
        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)

            if (isRootJSXElement(jsxElement) || !node.property.name.startsWith('component')) return

            context.report({
              message: messages['no component className'],
              node: node.property,
            })
          },
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
            message: messages['no className'],
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
        const checked = new Set()
        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] Identifier[name = 'layoutClassName']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checked.has(jsxElement)) return
            else checked.add(jsxElement)

            if (isRootJSXElement(jsxElement)) return

            context.report({
              message: messages['no layoutClassName'],
              node,
            })
          }
        }
      }
    },
    'component-name-starts-with-file-name': {
      create(context) {
        return {
          'ExportNamedDeclaration > FunctionDeclaration'(node) {
            const { name } = node.id
            if (firstLetterLowerCase(name)) return

            const expectedPrefix = getBaseFilename(context)
            if (name.startsWith(expectedPrefix)) return

            const expected = `${expectedPrefix}${name}`
            context.report({
              message: messages['invalid component name'](expected),
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
              message: messages['invalid css file name'](expected),
              node: node.source,
            })
          }
        }
      }
    },
  }
}

function getBaseFilename(context) {
  const filename = context.getFilename()
  return path.basename(filename, '.js')
}

function firstLetterLowerCase(word) {
  const firstLetter = word.slice(0, 1)
  return firstLetter.toLowerCase() === firstLetter
}

function getJSXElementName(jsxElement) {
  return jsxElement.openingElement.name.name
}

function getFunctionName(context) {
  return context.getScope().block.id.name
}

function isRootJSXElement(jsxElement) {
  return !getParentJSXElement(jsxElement)
}

function getParentJSXElement({ parent }) {
  if (!parent) return
  return parent.type === 'JSXElement'
    ? parent
    : getParentJSXElement(parent)

}
