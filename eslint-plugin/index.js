const path = require('path')

const messages = {
  'invalid className': expected => `invalid className\nexpected '${expected}'`,
  'no component className': `invalid className\nonly root nodes can have a className that starts with 'component'`,
  'no className': 'className is not allowed on custom components\nonly native (lower case) elements can have a className',
  'no export base': 'base components can not be exported\nremove the `export` keyword',
  'no layoutClassName': 'layoutClassName can not be used on child components\nset the layoutClassName as the className of the root node',
  'invalid component name': expected => `invalid component name\nexpected '${expected}'`,
  'invalid css file name': expected => `invalid css file name\nexpected '${expected}'`,
  'invalid styles variable name': `invalid variable name\nexpected name to be 'styles'`,
  'incorrect variable passing': name => `incorrect variable passing\nexpected \`{...{ ${name} }}\``,
  'destructure props': `props need to be destructured`,
}
module.exports = {
  messages,
  rules: {
    'root-component-class-name': {
      create(context) {
        const checked = new Set()

        return {
          [`ReturnStatement JSXAttribute[name.name = 'className'] MemberExpression[object.name = 'styles']`](node) {
            const jsxElement = getParentJSXElement(node)
            if (checked.has(jsxElement)) return
            else checked.add(jsxElement)

            if (hasParentsWithClassName(jsxElement)) return

            const prefix = new RegExp(`^${getBaseFilename(context)}`)
            const name = getFunctionName(context).replace(prefix, '')
            const expected = [`component${name}`, `component_root${name}`]
            if (expected.includes(node.property.name)) return

            const [common] = expected
            context.report({
              message: messages['invalid className'](common),
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

            if (!hasParentsWithClassName(jsxElement) || !node.property.name.startsWith('component')) return

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
    'force-css-variable-name': {
      create(context) {
        return {
          [`ImportDeclaration`](node) {
            const source = node.source.value
            if (!source.endsWith('.css')) return

            const name = getBaseFilename(context)
            const mainCss = `./${name}.css`
            if (source !== mainCss) return

            const specifier = node.specifiers[0].local
            if (specifier.name === 'styles') return

            context.report({
              message: messages['invalid styles variable name'],
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
            if (name !== node.value.expression.name) return
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
  const { name } = jsxElement.openingElement
  switch (name.type) {
    case 'JSXIdentifier': return name.name
    case 'JSXMemberExpression': return name.property.name
    default: throw new Error(`Can not determine name for '${name.type}'`)
  }
}

function getFunctionName(context) {
  return context.getScope().block.id.name
}

function isRootJSXElement(jsxElement) {
  return !getParentJSXElement(jsxElement)
}

function hasParentsWithClassName(jsxElement) {
  return getParentJSXElements(jsxElement).some(hasClassName)

  function hasClassName(jsxElement) {
    return jsxElement.openingElement.attributes.some(x => x.name.name === 'className')
  }
}

function getParentJSXElements(jsxElement) {
  const parent = getParentJSXElement(jsxElement)
  if (!parent) return []
  else return [parent, ...getParentJSXElements(parent)]
}

function getParentJSXElement({ parent }) {
  if (!parent) return
  return parent.type === 'JSXElement'
    ? parent
    : getParentJSXElement(parent)

}
