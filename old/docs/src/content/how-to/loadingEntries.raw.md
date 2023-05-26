## Loading entries

In some cases you need to add a piece of 'old-fashioned' javascript or CSS to a site.

In order for your classnames to be global you create a `{name}.entry.css` file.

To make sure you javascript is a separate entry that is compiled for the web you create a
`{name}.entry.js` file.

Now to automatically include them in your site you simply need to register the dependency by
importing them:

```jsx
import '/main.entry.css'
import '/main.entry.js'
import stylesheet from '@kaliber/build/lib/stylesheet'
import javascript from '@kaliber/build/lib/javascript'

export default (
  <html>
    <head>
      {stylesheet}
      {javscript}
    </head>
    <body />
  </html>
)
```
