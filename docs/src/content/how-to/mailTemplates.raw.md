## Mail templates

We use React to generate our mail templates. We do that with the help of [`mjml`](https://mjml.io).

{toc}

### Configure custom renderer

`config/default.js`
```js
module.exports = {
  kaliber: {
    templateRenderers: {
      mjml: '/mjml-renderer'
    }
  }
}
```

We tell the build tool to render `{name}.mjml.js` files with the `src/mjml-renderer.js` renderer.

### Create mjml renderer

We first render React to mjml and then render that result to html.

`src/mjml-renderer.js`
```js
import { mjml2html } from 'mjml'
import htmlReactRenderer from '@kaliber/build/lib/html-react-renderer'

export function mjmlRenderer({ template }) {
  const { html, errors } = mjml2html(htmlReactRenderer(template))

  if (errors.length > 0) throw new Error(errors.map(e => e.formattedMessage).join('\n'))

  return html
}
```

### Create a template

`static.mjml.js`
```js
export default (
  <mjml>
    <mj-head />
    <mj-body>
      <mj-container>
        <mj-section>Text</mj-section>
      </mj-container>
    </mj-body>
  </mjml>
)
```

The above example results in a `static.mjml` file that contains the html that can be used for the
e-mail. In most cases however you want your e-mail to contain dynamic data.

`dynamic.mjml.js`
```js
export function dynamic({ props }) {
  const { content } = props
  return (
    <mjml>
      <mj-head />
      <mj-body>
        <mj-container>
          <mj-section>{content}</mj-section>
        </mj-container>
      </mj-body>
    </mjml>
  )
}
```

This results in a `dynamic.mjml.js` file that exports a function which, when given
`{ content: '...' }` returns the mjml generated html string. This function can be used to generate
an e-mail from a node.js process.
