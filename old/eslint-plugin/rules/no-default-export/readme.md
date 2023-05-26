# No default export

We prefer not to use a default export because it would force us to make hard decisions. For example:

> If you have a `Button` component in `Button.js` it makes sense to export it as a `default`. Later in the project you figure out you need another button, so you end up with `ButtonRed` and `ButtonGreen`. If you don't refactor your other code one of these buttons remains the `default`. When you look at the `Button.js` file without context it does not 'feel' right to have two (equal value) buttons where one of them is made more important by the `default` keyword.
>
> The situation becomes even weirder when the non `default` button becomes the most widely used button. At that point you are probably forced to remove the `default` keyword and with that need to change all the files that import `Button.js`.

To prevent these kinds of situations we start with named exports.

Other people have taken the time to write down some more reasons: https://humanwhocodes.com/blog/2019/01/stop-using-default-exports-javascript-module/

Concretely, the following should be refactored as shown:

```jsx
export default function MyComponent() {}
```

```jsx
export function MyComponent() {}
```

There are however a few situations where a `default` does make sense:

- `App` - An app is the universal entrypoint and with `@kaliber/build` a component is made universal by adding `?universal` to the `import` statement: `import App from './App?universal'`. The code that handles the magic of making a component universal (rendered on the server and client) assumes the file exports a single component.
- `template.type.js` - A template like mail `registration.mjml.js` is converted to `registration.js` which is intended to be called by a node.js process. The conversion takes place by a template renderer mechanism. This mechanism expects a single `defaul` export.

## Examples

Examples of *correct* code for this rule:

```js
export function Test() {}
```
`App.js`:
```js
export default function App() {}
```
`TestApp.js`:
```js
export default function App() {}
```
`index.html.js`:
```js
export default function Index() {}
```
`template.mjml.js`:
```js
export default function Template() {}
```

Examples of *incorrect* code for this rule:

```js
export default function Test() {}
```
