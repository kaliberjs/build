import { mjml2html } from 'mjml'
import htmlReactRenderer from '@kaliber/build/lib/html-react-renderer'

export default function mjmlRenderer (template) {
  const { html, errors } = mjml2html(htmlReactRenderer(template))

  if (errors.length > 0) throw new Error(errors.map(e => e.formattedMessage).join('\n'))

  return html
}
