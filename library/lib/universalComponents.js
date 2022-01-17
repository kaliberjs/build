import ReactDom from 'react-dom'

const containerMarker = 'data-kaliber-component-container'

export function ComponentServerWrapper({ componentName, props, renderedComponent }) {
  const componentInfo = JSON.stringify({ componentName, props })
  return (
    <>
      {/* It is not possible to render the html of a React-rendered component without a container
          because dangerouslySetInnerHTML is the only route to get raw html into the resulting html */}
      <kaliber-component-container dangerouslySetInnerHTML={{ __html: renderedComponent }} />

      {/* Use render blocking script to remove the container and supply the correct  comment nodes.
          This ensures the page is never rendered with the intermediate structure */}
      <script dangerouslySetInnerHTML={{ __html: restructureDomNodes(componentInfo) }} />
    </>
  )
}

export function findComponents({ componentName }) {
  if (typeof window === 'undefined') throw new Error(`The function 'findComponents' can only be used in the browser`)

  const findComponentCache = getFindComponentCache()
  const components = findComponentCache[componentName] || []
  return components

  function getFindComponentCache() {
    if (!findComponents.cache) findComponents.cache = findAndGroupAllComponents()
    return findComponents.cache

    function findAndGroupAllComponents() {
      return groupComponentsByName(findAllComponents())
    }
  }
}

export function hydrate(
  component,
  {
    nodes,
    endNode: insertBefore,
    container = createContainer({ eventTarget: insertBefore.parentNode }),
  },
) {
  // Move the rendered nodes to a container before hydrating
  nodes.forEach((x) => { container.appendChild(x) })

  ReactDom.hydrate(component, container)

  // Capture the rendered nodes before they are moved by inserting the container
  const renderedNodes = Array.from(container.childNodes)
  insertBefore.parentNode.insertBefore(container, insertBefore)

  return { container, renderedNodes }
}

function createContainer({ eventTarget }) {
  // React attaches event listeners to the container on hydrate or render. This does not make
  // sense for document fragments, so we forward all EventTarget methods.
  const container = document.createDocumentFragment()
  container.addEventListener = (...args) => eventTarget.addEventListener(...args)
  container.removeEventListener = (...args) => eventTarget.removeEventListener(...args)
  container.dispatchEvent = (...args) => eventTarget.dispatchEvent(...args)
  return container
}

function findAllComponents() {
  const containers = document.querySelectorAll(`*[${containerMarker}]`)
  return Array.from(containers).flatMap(extractServerRenderedComponents) // this requires flatMap polyfill (es2019)
}

function groupComponentsByName(allComponents) {
  return allComponents.reduce(
    (result, { info: { componentName, props }, nodes, endNode }) => {
      const components = result[componentName] || (result[componentName] = [])
      components.push({ componentName, nodes, endNode, props })
      return result
    },
    {}
  )
}

function restructureDomNodes(componentInfo) {
  return `|var d=document,s=d.currentScript,p=s.parentNode,c=s.previousSibling;
          |p.setAttribute('${containerMarker}','');                             // set marker on container so we can retrieve nodes that contain components
          |p.replaceChild(d.createComment('start'),c);                          // replace kaliber-component-container element with a 'start' comment
          |p.insertBefore(d.createComment(JSON.stringify(${componentInfo})),s); // create a comment containing the component info
          |Array.from(c.childNodes).forEach(x=>{p.insertBefore(x,s)});          // insert all children from the kaliber-component-container element
          |p.replaceChild(d.createComment('end'),s);                            // create an 'end' comment
          |`.replace(/^\s*\|/gm, '').replace(/\s*\/\/[^;]*?$/gm, '').replace(/\n/g, '')
}

function extractServerRenderedComponents(container) {
  // These steps work with the DOM structure created by the render blocking script
  const steps = [
    [not(isStart), ignore, repeat],
    [isStart, ignore, nextStep],
    [isComment, dataAsJson('info'), nextStep],
    [not(isEnd), addNodeToCollection('nodes'), repeat],
    [isEnd, addNode('endNode'), commitAndRestart]
  ]

  return executeSteps({ steps, node: container.firstChild })
}

function executeSteps({ steps, node, data = {}, set = [], originalSteps = steps }) {
  if (!steps.length || !node) return set

  const [[predicate, extractData, determineNext]] = steps

  return executeSteps(
    predicate(node)
      ? determineNext({ node, steps, data: extractData({ data, node }), set, originalSteps })
      : tryNextStep({ node, steps, data, set, originalSteps })
  )
}

// Predicates
function isStart(x) { return isComment(x) && x.data === 'start' }
function isEnd(x) { return isComment(x) && x.data === 'end' }
function isComment(x) { return x.nodeType === 8 }
function not(f) { return x => !f(x) }

// Extraction
function ignore({ data }) { return data }
function dataAsJson(key) { return ({ data, node }) => ({ ...data, [key]: JSON.parse(node.data) }) }
function addNodeToCollection(key) {
  return ({ data, node }) => ({ ...data, [key]: (data[key] ?? []).concat(node) })
}
function addNode(key) { return ({ data, node }) => ({ ...data, [key]: node }) }

// Control
function repeat({ node, ...state }) {
  return { node: node.nextSibling, ...state }
}
function nextStep({ node, steps, ...state }) {
  return { node: node.nextSibling, steps: steps.slice(1), ...state }
}
function tryNextStep({ steps, ...state }) {
  return { steps: steps.slice(1), ...state }
}
function commitAndRestart({ node, originalSteps, data, set }) {
  return { node: node.nextSibling, steps: originalSteps, data: {}, set: set.concat(data) }
}
