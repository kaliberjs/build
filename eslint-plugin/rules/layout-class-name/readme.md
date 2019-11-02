# Layout class name

Passing a `className` to a custom component is considered harmful. Components should be treated as a black box. Doing so allows you to change the inner details of a component as long as you keep the public API unchanged. In other words: it does not make sense to give a custom component a `className` because you don't know what is inside.

This however poses a problem when you want to position a custom component. To solve this common use case we introduced `layoutClassName`. As the name suggests, classes used as layout class name should
only be used to manipulate layout and make no assumptions about the inner structure. When passing a `layoutClassName` you can assume it to be set as `className` on the top level element of the custom component.

Concretely, the following should be refactored as shown:

```jsx
function MyComponent() {
  return (
    <div className={styles.component}>
      <BlackBox className={styles.blackBox} />
    </div>
  )
}
```

```jsx
function MyComponent() {
  return (
    <div className={styles.component}>
      <BlackBox layoutClassName={styles.blackBox} />
    </div>
  )
}
```

Another situation where this rule is problematic is that of similarly styled components. A good example is a set of `Button` components. These often have the same base structure and styling. To allow for this use case we introduced the concept of a `Base` component.

`Base` components are allowed to be given a `className`, they can however not be exported. This ensures we are not breaking our black box principle. An example:

```jsx
export function ButtonBlue({ onClick, children }) {
  return <ButtonBase className={styles.componentBlue} {...{ onClick, children }} />
}

export function ButtonRed({ onClick, children }) {
  return <ButtonBase className={styles.componentRed} {...{ onClick, children }} />
}

function ButtonBase({ className, onClick, children }) {
  return <button className={cx(styles.componentBase, className)} {...{ onClick, children }} />
}
```

## Examples

Examples of *correct* code for this rule:

```jsx
function Test({ layoutClassName }) {
  return <div className={layoutClassName} />
}
```
```jsx
<div className={styles.test} />
```
```jsx
<TestBase className={styles.test} />
```
```jsx
function TestBase({ className }) {
  return <div {...{ className }} />
}
```
```jsx
<ReactSpring.animated.article className={styles.test} />
```

Examples of *incorrect* code for this rule:

```jsx
function Test({ layoutClassName }) {
  return (
    <div>
      <div className={layoutClassName} />
    </div>
  )
}
```
```jsx
function Test({ layoutClassName }) {
  return (
    <div className={cx(layoutClassName, styles.component_root)} />
  )
}
```
```jsx
<Test className={styles.test} />
```
```jsx
export function TestBase() {}
```

