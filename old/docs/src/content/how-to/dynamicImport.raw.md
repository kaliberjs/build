## Dynamic import

In some cases it makes sense to exclude certain parts from your main bundle. Webpack allows this
by supporting the `import(...)` function.

With this library dynamic imports are only compiled for the web, so make sure they are in the 'web
part' of your React components (`componentDidMount`). If you have a use case that requires dynamic
imports to work on the server side as well, raise an issue with your use-case.

A simple example:
```jsx
async componentDidMount() {
  const { default } = await import('./DymicallyImportedModule')
  console.log('imported', default)
}
```

Make sure to to read the Webpack documentation about [import()](https://webpack.js.org/api/module-methods/#import-)
