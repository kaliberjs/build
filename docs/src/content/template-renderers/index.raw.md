## Template renderers

The concept of template renderers is both simple and powerful. It allows you to use javascript to
generate other types of files.

We make a distinction between static and dynamic templates. Static templates are rendered during the
build and dynamic templates will be turned into function that can be executed by node.js.

Another distinction can be make by looking at the output, given a `{name}.{type}.js` file:
- a static template would result in a `{name}.type` file.
- a dynamic template would result in a `{name}.type.js` file.

{toc}

### Registration

To register a custom template renderer for a specific type you add it to the configuration:

```js
module.exports = {
  kaliber: {
    templateRenderers: {
      myType: '/my-type-renderer'
    }
  }
}
```

This tells the build system to use `src/my-type-renderer` for all `*.myType.js` files.

### Creation

A template renderer has a very simple signature: `any => string` where the argument passed in is the
content of the template and the result is the string that is stored in the file.

As an example, the renderer we use for the `*.html.js` files:

```js
const ReactDOMServer = require('react-dom/server')
const { isElement } = require('react-dom/test-utils')

module.exports = function htmlReactRenderer(template) {
  if (!isElement(template)) return template
  return '<!DOCTYPE html>\n' + ReactDOMServer.renderToStaticMarkup(template)
}
```

This renderer assumes that the template is a React element.

Another example, this time for `*.json.js` files:

```js
module.exports = function jsonRenderer(template) {
  return JSON.stringify(template)
}
```

This renderer expects any javascript value as template.

### Usage

As we have stated, we make a distinction between static and dynamic templates. The convention to
switch between a static and dynamic template is very simple:

- If you export a non-function it will be treated as a static template
- If you export a function from a template it is treated as a dynamic template

#### Static

Static templates are transformed at build type from `{name}.{type}.js` to `{name}.{type}.js`.

A static html template:

`src/index.html.js`
```jsx
export default (
  <html>
    <head />
    <body>Hello world!</body>
  </html>
)
```
Results in a `target/index.html` file.


A static json template:

`src/test.json.js`
```js
export default {
  hello: 'World!'
}
```
Results in a `target/test.json` file.


#### Dynamic

At build time dynamic templates are wrapped / replaced by another function like this:

```js
import template from '...'
import templateRenderer from '...'

export default function wrappedTemplate(props) {
  return templateRenderer(template(props))
}
```

This means that `{name}.{type}.js` is transformed but outputted with the same name.

A dynamic html template:

`src/index.html.js`
```jsx
export default function index({ title, content }) {
  return (
    <html>
      <head><title>{title}</title></head>
      <body>
        <h1>{title}</h1>
        <p>{content}</p>
      </body>
    </div>
  )
}
```
Results in a `target/index.html.js` file that contains a function which, given a `title` and
`content`, returns an html string.

A dynamic json template:

`src/test.json.js`
```js
export default function test({ message }) {
  return { message }
}
```
Results in a `target/test.json.js` file that contains a function which, given a `message`, returns
a json string containing an object with the message.

