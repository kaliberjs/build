import React from 'react'
import ReactDom from 'react-dom'
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

      {/* Use render blocking script to remove the container and supply the correct  comment nodes.
          This ensures the page is never rendered with the intermediate structure */}
      <script dangerouslySetInnerHTML={{
        __html: scriptContent
      }} />
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

// This script should be the same for all components in order for us to add its hash to the content policy
function restructureDomNodes() {
  return `
    var d=document,s=d.currentScript,p=s.parentNode;
    p.setAttribute('${containerMarker}','');                             // set marker on container so we can retrieve nodes that contain components
    Array.from(p.querySelectorAll('${E}')).forEach(x=>p.removeChild(x)); // remove all (empty) container tags
    p.removeChild(s);                                                    // remove the script tag itself
  `
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
