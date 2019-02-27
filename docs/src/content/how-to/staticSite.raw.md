## Static site

With a static site we mean a site where the html is not generated on the server at runtime. You
could also call this a compiler generated site as the html template is rendered during the build
process.

The resulting set of files can be hosted on the most basic systems for hosting as the only
capability that is required from the hosting is the ability to serve files.

{toc}

### Creating the template

The convention we use for creating a static template (versus a dynamic template) is: return a
non-function value. An example:

`src/index.html.js`
```jsx
import stylesheet from '@kaliber/build/lib/stylesheet'
import styles from '/main.css'

return (
  <html>
    <head>{stylesheet}</head>
    <body>
      <div className={styles.content}>
        <p>Hello world</p>
      </div>
    <body>
  </html>
)
```

`src/main.css`
```css
.content {
  background-color: hotpink;
}
```

As you can see the library performs the following tasks:
- picks up the `{name}.html.js` file
- detects it is not a function
- uses the registered `html` renderer to render the file
- emits a `{name}.html` file

Note that we use modular CSS, this gives us more freedom in picking class names, we only need make
sure a class name is unique within a CSS file. The actual class name (some form of unique id) is
returned to the javascript and passed to the `className` property. So having a `title` class name
in different CSS files is no problem at all.

### When to use

This type of site it used for something that doesn't change a lot as each change requires a new
build. Note that this style of working is currently very popular in the javascript world.

As soon as you want to render something based on information from a datasource that changes
independently of your code, you will probably need server side rendering.

This type of site is mostly used for action sites and landing pages.

### Non-modular CSS

In some cases you need to create a static site that some other company wants needs to integrate in
their own system. They will copy and paste your generated html into their own framework to add
dynamic data.

Or, another use case, the html is more of a style guide and the CSS is the actual end-product.

In that case you can use the `{name}.entry.css` convention. Modular CSS is disabled for all CSS
files the have the `{name}.entry.css` pattern. Your template would look like this:

`src/index.html.js`
```jsx
import stylesheet from '@kaliber/build/lib/stylesheet'
import '/main.entry.css'

return (
  <html>
    <head>{stylesheet}</head>
    <body>
      <div className='content'>
        <p>Hello world</p>
      </div>
    <body>
  </html>
)
```

`src/main.entry.css`
```css
.content {
  background-color: hotpink;
}
```

In this case it's recommended you use a CSS convention for naming your styles.

### Adding javascript

In most sites we want to use javascript to improve the user experience, or to provide some dynamic
features like a form.

For this type of site universal rendering is the way to do it.

`src/index.html.js`
```jsx
import javascript from '@kaliber/build/lib/javascript'
import MyInteractiveComponent from '/MyInteractiveComponent?universal'

return (
  <html>
    <head>{javascript}</head>
    <body>
      <MyInteractiveComponent content='Hello world!' />
    <body>
  </html>
)
```

`src/MyInteractiveComponent.js`
```js
export default class MyInteractiveComponent extends Component {

  state = {
    content: this.props.content
  }

  render() {
    return <p>{this.state.content}</p>
  }

  componentDidMount() {
    this.setState({ content: 'This content is set using javascript in the browser' })
  }
}
```

The `componentDidMount` function is only executed in the browser.

### The server (404 and 500)

The server this library provides recognizes that static hosting often allows you to provide a custom
`404` (and sometimes a `500`) page.

When you create a `404.html` page, that page will automatically be served in case our server did not
find the requested file. The `500.html` is served in case of an unexpected error.

Note that if you do not supply a `404.html`, the `index.html` file is served with status code `200`.

### Static content sites - reducing boilerplate with a custom renderer

It might be the case that a static site is really your best option, but the amount of pages you need
to create is quite huge. In this case you can create a custom template renderer to cut down on the
boilerplate.

This is just an example, you can get as creative a you would like.

`config/default.js`
```js
module.exports = {
  kaliber: {
    templateRenderers: {
      html: '/html-renderer'
    }
  }
}
```

Here we declare a renderer that will be used for any `{name}.html.js` file, effectively overriding
the default `html` renderer.

`src/html-renderer.js`
```jsx
import javascript from '@kaliber/build/lib/javascript'
import stylesheet from '@kaliber/build/lib/stylesheet'
import htmlReactRenderer from '@kaliber/build/lib/htmlReactRenderer'

export default tplRenderer(template) {
  if (!template) return template

  const { title, content } = template
  const page = (
    <html>
      <head>
        {javascript}
        {stylesheet}
      </head>
      <body>
        <h1>{template.title}</h1>
        <p>{template.content}<p>
      </body>
    </html>
  )

  return htmlReactRenderer(page)
}
```

This renderer assumes that the template is a javascript object with the properties `title` and
`content`. It uses that information to construct an html page that is rendered with the built-in
react renderer.

`src/content.html.js`
```js
export default {
  title: 'Awesome content',
  content: (
    <>
      <strong>The world</strong> is a strange place
    </>
  )
}
```

The result is a `content.html` file. As you can see this mechanism gives you a lot of options to
reduce boilerplate.
