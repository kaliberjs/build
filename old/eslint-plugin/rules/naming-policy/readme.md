# Naming policy

To improve readability and consistency we enforce a naming policy. On top of that we strongly believe in convention over configuration and the naming policy allows our tools to configure themselves based on certain naming patterns.

- [Component name](#component-name)
- [CSS file and variable name](#css-file-and-variable-name)
- [CSS variable properties](#css-variable-properties)
- [Root element class name](#root-element-class-name)
- [Refs](#refs)

## Component name

An exported component name should include the name of the file it is in.

### Examples

Examples of *correct* code for this rule:

`Test.js`:
```js
export function Test() {}
```
`Test.js`:
```js
function Something() {}
```
`Test.js`:
```js
export function something() {}
```
`App.js`:
```js
export default function App() {}
```
`index.html.js`:
```js
export default function Index() {}
```

Examples of *incorrect* code for this rule:

`Test.js`:
```js
export function Something() {}
```
`App.js`:
```js
export default function Something() {}
```

## CSS file and variable name

We enforce a tight relation between the `styles` variable and the associated CSS file name. This is mostly for consistency, it however also allows us to add other rules based on the name `styles`. This rule makes sure that the `styles` variable is tied to the components in the file.

### Examples

Examples of *correct* code for this rule:

`Test.js`:
```js
import styles from './Test.css'
```
`Test.js`:
```js
import x from 'something'
```
`Test.js`:
```js
import abcStyles from './Other.css'
```
`Test.js`:
```js
import notStyles from './NotCss'
```

Examples of *incorrect* code for this rule:

`Test.js`:
```js
import styles from './Something.css'
```
`Test.js`:
```js
import notStyles from './Test.css'
```

## CSS variable properties

This rule helps to prevent accidental usage of unwanted CSS modules features.

### Examples

Examples of *correct* code for this rule:

```js
styles.abc
```
```js
styles._root
```
```js
styles._rootAbc
```
```js
styles[`abc${index}`]
```

Examples of *incorrect* code for this rule:

```js
styles._abc
```

## Root element class name

Not all components are equal. We make a distinction between a some types of components:

- `app` - An app is a component that represents the boundary for universal rendering. The app is the first component that is both rendered on the server and the client.
- `page` - A page is full html page. In single page applications the pages are rendered by the app. In static of server side rendered applications pages can contain zero or more apps.
- `component` - All other custom components that are not an `app` or a `page` are considered to be a component.

We enforce a relation between the type of the component and their root element class name. This allows us to set specific rules based on the intended usage of the component.

### Examples

Examples of *correct* code for this rule:

`Test.js`:
```jsx
function Test() {
  return <div className={styles.component} />
}
```
`Test.js`:
```jsx
function TestAbc() {
  return <div className={styles.componentAbc} />
}
```
`Test.js`:
```jsx
function Test() {
  return (
    <Wrapper>
      <div className={styles.component} />
    </Wrapper>
  )
}
```
`App.js`:
```jsx
function App() {
  return (
    <div className={styles.app} />
  )
}
```
`src/pages/Something.js`:
```jsx
function Something() {
  return (
    <div className={styles.page} />
  )
}
```

Examples of *incorrect* code for this rule:

`Test.js`:
```jsx
function Test() {
  return <div className={styles.test} />
}
```
`App.js`:
```jsx
function App() {
  return <div className={styles.test} />
}
```
`src/pages/Something.js`:
```jsx
function Something() {
  return <div className={styles.test} />
}
```
`Test.js`:
```jsx
function Test() {
  return (
    <Wrapper>
      <div className={styles.component} />
      <div className={styles.component} />
    </Wrapper>
  )
}
```
`Test.js`:
```jsx
function TestAbc() {
  return (
    <Wrapper>
      <div className={styles.componentAbc} />
      <div />
    </Wrapper>
  )
}
```
`Test.js`:
```jsx
function Test() {
  return (
    <div className={styles.component}>
      <div className={styles.componentX} />
    </div>
  )
}
```

## Refs

Refs have a specific use and it's very handy if you know a variable is a ref; you are required to use the `current` property if you want to get at the value. This policy enforces you to suffix your ref with `Ref`, clearly indicating the variable contains a ref.

### Examples

Examples of *correct* code for this rule:

```jsx
function Test() {
  const containerRef = React.useRef()

  ...
}
```

```jsx
function Test() {
  const isMountedRef = useIsMountedRef()

  ...
}
```

Examples of *incorrect* code for this rule:

```jsx
function Test() {
  const container = React.useRef()

  ...
}
```

```jsx
function Test() {
  const isMounted = useIsMountedRef()

  ...
}
```

