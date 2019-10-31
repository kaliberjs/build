module.exports = {
  getPropertyName,
  getFunctionName,
  getJSXElementName, getParentJSXElement,
  isRootJSXElement, hasParentsJSXElementsWithClassName, isInJSXBranch
}

function getPropertyName(property) {
  switch (property.type) {
    case 'Identifier': return property.name
    case 'Literal': return property.value
    case 'BinaryExpression': return getPropertyName(property.left)
    case 'TemplateLiteral':
      const [name] = property.quasis
      return name.value.raw
    default: throw new Error(`Can not determine name for '${property.type}'`)
  }
}

function getFunctionName(context) {
  return getRootFunctionName(context.getScope())

  function getRootFunctionName(node, previous = []) {
    const { upper } = node
    const [lastSeen] = previous
    if (upper.type === 'module') {
      if (node.type === 'function') return getName(node)
      else if (lastSeen) return getName(lastSeen)
      else throw new Error('Could not find root function name')
    } else {
      return getRootFunctionName(upper, [...(node.type === 'function' ? [node] : []), ...previous])
    }

    function getName({ block: { id } }) {
      return id ? id.name : '???'
    }
  }
}

function getJSXElementName(jsxElement) {
  const { name } = jsxElement.openingElement
  switch (name.type) {
    case 'JSXIdentifier': return name.name
    case 'JSXMemberExpression': return name.property.name
    default: throw new Error(`Can not determine name for '${name.type}'`)
  }
}

function isRootJSXElement(jsxElement) {
  return !getParentJSXElement(jsxElement)
}

function hasParentsJSXElementsWithClassName(jsxElement) {
  return getParentJSXElements(jsxElement).some(hasClassName)

  function hasClassName(jsxElement) {
    return jsxElement.openingElement.attributes
      .some(x => x.type === 'JSXAttribute' && x.name.name === 'className')
  }
}

function isInJSXBranch(jsxElement) {
  return getParentJSXElements(jsxElement).some(hasBranchingChildren)

  function hasBranchingChildren(jsxElement) {
    const branchCandidate = ['JSXElement', 'JSXExpressionContainer']
    const [first, ...rest] = jsxElement.children.filter(x => branchCandidate.includes(x.type))
    return rest.length > 0 || first.type === 'JSXExpressionContainer'
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