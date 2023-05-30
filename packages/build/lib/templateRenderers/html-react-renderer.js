import { renderToStaticMarkup } from 'react-dom/server'
import { isElement } from 'react-dom/test-utils'

export default function htmlReactRenderer(template) {
  if (!isElement(template)) return template
  return '<!DOCTYPE html>\n' + renderToStaticMarkup(template)
}
