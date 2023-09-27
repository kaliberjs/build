import { hydrateRoot } from 'react-dom/client'
import { safeJsonStringify } from '@kaliber/safe-json-stringify'

const containerMarker = 'data-kaliber-component-container'
const E = /** @type {any} */ ('kaliber-component-container')

// eslint-disable-next-line @kaliber/naming-policy
export function ComponentServerWrapper({ componentName, props, renderedComponent }) {
  const scriptContent = restructureDomNodes()
  const safeComponentInfo = safeJsonStringify({ componentName, props })

  return (
    <>
      {/* It is not possible to render the html of a React-rendered component without a container
          because dangerouslySetInnerHTML is the only route to get raw html into the resulting html */}
      <E dangerouslySetInnerHTML={{ __html:
        `</${E}><!--start--><!--${safeComponentInfo}-->${renderedComponent}<!--end--><${E}>`
      }} />

      {/* Use render blocking script to set a container marker and remove the custom components.
          This ensures the page is never rendered with the intermediate structure */}
      <script dangerouslySetInnerHTML={{ __html: scriptContent }} />
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

export function hydrate(component, { nodes: initialNodes, startNode, endNode }) {
  const container = createVirtualReactContainer({ initialNodes, startNode, endNode })
  const root = hydrateRoot(container, component)

  return { 
    update(newComponent) {
      root.unmount()
      root = createRoot(container)
      root.render(newComponent) 
    }
  }
}

function createVirtualReactContainer({ initialNodes, startNode, endNode }) {
  const parent = startNode.parentNode
  let nodes = initialNodes.slice() // we could derive initialNodes from startNode and endNode

  const container = {
    addEventListener: (...args) => parent.addEventListener(...args),
    removeEventListener: (...args) => parent.removeEventListener(...args),
    dispatchEvent: (...args) => parent.dispatchEvent(...args),
    get firstChild() { return nodes[0] || null },
    get nodeType() { return parent.DOCUMENT_FRAGMENT_NODE },
    get ownerDocument() { return parent.ownerDocument },
    get nodeName() { return 'virtualized container' },
    removeChild(child) {
      const result = parent.removeChild(child)
      nodes = nodes.filter(x => x !== child)
      return result
    },
    appendChild(child) {
      endNode.before(child)
      nodes = nodes.concat([child])
      return child
    },
    insertBefore(node, child) {
      const childIndex = nodes.findIndex(x => x === child)
      const result = parent.insertBefore(node, child)
      nodes.splice(childIndex, 0, result)
      return result
    },
  }
  // The statement below is a lie. We supply an object that has all methods that React calls on it
  return /** @type {Element} */ (container)
}

function findAllComponents() {
  const containers = document.querySelectorAll(`*[${containerMarker}]`)
  return Array.from(containers).flatMap(extractServerRenderedComponents) // this requires flatMap polyfill (es2019)
}

function groupComponentsByName(allComponents) {
  return allComponents.reduce(
    (result, { info: { componentName, props }, nodes, startNode, endNode }) => {
      const components = result[componentName] || (result[componentName] = [])
      components.push({ componentName, nodes, startNode, endNode, props })
      return result
    },
    {}
  )
}

function restructureDomNodes() {
  return `
    var d=document,s=d.currentScript,p=s.parentNode;
    ${/* set marker on container so we can retrieve nodes that contain components */''}
    p.setAttribute('${containerMarker}','');
    ${/* remove all (empty) container tags */''}
    Array.from(p.querySelectorAll('${E}')).forEach(x=>p.removeChild(x));
    ${/* remove the script tag itself */''}
    p.removeChild(s);
  `.replace(/(^\s*|\n)/gm, '')
}

function extractServerRenderedComponents(container) {
  // These steps work with the DOM structure created by the render blocking script
  const steps = [
    [not(isStart), ignore, repeat],
    [isStart, addNode('startNode'), nextStep],
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
