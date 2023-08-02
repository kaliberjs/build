const { firstLetterLowerCase } = require('../../machinery/word')
const {
  getPropertyName,
  getJSXElementName, getParentJSXElement,
  isRootJSXElement
} = require('../../machinery/ast')

const messages = {
  'no layoutClassName in child':
    `Unexpected 'layoutClassName', only root elements can use the 'layoutClassName' - set the ` +
    `'layoutClassName' as 'className' of the root element`,

  'no _root with layoutClassName':
    `Unexpected 'layoutClassName', '_root' and 'layoutClassName' can not be combined`,

  'no className on custom component':
    `Unexpected attribute 'className', only native (lower case) elements can have a 'className' - ` +
    `use 'layoutClassName' for manipulating layout`,

  'invalid layoutClassName':
    (found, expected) => `Unexpected layoutClassName '${found}', expected '${expected}'`,
  
  'no export base':
    `Unexpected 'export', Base components can not be exported - remove the 'export' keyword`,
}

module.exports = {
  messages,

  meta: { type: 'problem' },

  create(context) {
    const hasLayoutClassName = new Set()
    const foundRootReferences = new Map()

    return {
      [`ReturnStatement JSXAttribute[name.name = 'className'] Identifier[name = 'layoutClassName']`](node) {
        const jsxElement = getParentJSXElement(node)
        if (hasLayoutClassName.has(jsxElement)) return
        else hasLayoutClassName.add(jsxElement)

        if (isRootJSXElement(jsxElement)) reportInvalidComboFromClassName(jsxElement)
        else reportLayoutClassNameInChild(node)
      },
      [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
        const jsxElement = getParentJSXElement(node)

        const property = findRootProperty(jsxElement, node)
        if (!property) return
        foundRootReferences.set(jsxElement, property)

        reportInvalidComboFromStyles(jsxElement, property)
      },
      [`JSXSpreadAttribute Property[key.name = 'className']`](node) {
        reportClassNameOnCustomComponent(node)
      },
      [`JSXAttribute[name.name = 'className']`](node) {
        reportClassNameOnCustomComponent(node)
      },
      [`JSXAttribute[name.name = 'layoutClassName'] MemberExpression[object.name = 'styles']`](node) {
        reportInvalidLayoutClassName(node.property, node.property.name)
      },
      [`JSXAttribute[name.name = 'layoutClassName'] Literal`](node) {
        reportInvalidLayoutClassName(node, node.value)
      },
      [`ExportNamedDeclaration > FunctionDeclaration`](node) {
        reportExportedBase(node)
      },
    }

    function reportInvalidComboFromClassName(jsxElement) {
      if (!foundRootReferences.has(jsxElement)) return

      context.report({
        message: messages['no _root with layoutClassName'],
        node: foundRootReferences.get(jsxElement)
      })
    }

    function reportInvalidComboFromStyles(jsxElement, property) {
      if (!hasLayoutClassName.has(jsxElement)) return

      context.report({
        message: messages['no _root with layoutClassName'],
        node: property
      })
    }

    function reportLayoutClassNameInChild(node) {
      context.report({
        message: messages['no layoutClassName in child'],
        node,
      })
    }

    function reportClassNameOnCustomComponent(node) {
      const jsxElement = getParentJSXElement(node)
      const name = getJSXElementName(jsxElement)

      if (
        firstLetterLowerCase(name) 
        || name.endsWith('Base') 
        || name === 'FloatingOverlay'
      ) return

      context.report({
        message: messages['no className on custom component'],
        node,
      })
    }

    function reportInvalidLayoutClassName(node, className) {
      const expectedClassName = className.endsWith('Layout') ? className : className + 'Layout'

      if (className === expectedClassName) return
      context.report({
        message: messages['invalid layoutClassName'](className, expectedClassName),
        node: node,
      })
    }

    function reportExportedBase(node) {
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

function findRootProperty(jsxElement, node) {
  if (!isRootJSXElement(jsxElement)) return

  const { property } = node
  const className = getPropertyName(property)
  if (!['_root', 'component_root'].some(x => className.startsWith(x))) return
  return property
}
