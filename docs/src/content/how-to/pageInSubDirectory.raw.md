## Page in sub directory

Sometimes you are asked to create an application that will live in the sub directory of another
site.

To do that, just supply the `publicPath` configuration:

`config/default.js`
```js
module.exports = {
  kaliber: {
    publicPath: '/directory/'
  }
}
```
