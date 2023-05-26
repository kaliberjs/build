# Component properties

- [Destructure props](#destructure-props)
- [Variable passing](#variable-passing)

## Destructure props

We require props of components to be destructured, this helps type inference to determine what properties are available. If the editor knows what properties are available it can warn about incorrect properties.

Concretely, the following should be refactored as shown:

```jsx
function MyComponent(props) {
  return <Abc test={props.value} />
}
```

```jsx
function MyComponent({ value }) {
  return <Abc test={value} />
}
```

### Examples

Examples of *correct* code for this rule:

```js
function Test() {}
```
```js
function Test({ prop }) {}
```
```js
function test(props) {}
```

Examples of *incorrect* code for this rule:

```js
function Test(props) {}
```

## Variable passing

This rule is mainly to create a more consistent code base. It however allows to quickly see what properties are passed through.

Concretely, the following should be refactored as shown:

```jsx
function MyComponent({ test }) {
  return <Abc test={test} />
}
```

```jsx
function MyComponent({ test }) {
  return <Abc {...{ test } />
}
```

### Examples

Examples of *correct* code for this rule:

```jsx
<div {...{ test1 }} />
```
```jsx
<div test1={test2} />
```
```jsx
<div test='test' />
```
```jsx
<div test />
```
```jsx
<div key={key} />
```

Examples of *incorrect* code for this rule:

```jsx
<div test1={test1} />
```
