import xml from 'xml'

export default function xmlRenderer(o) {
  return xml(o, { declaration: true })
}
