## Getting started

The hard part is not getting started, it's choosing the right type of application.

{toc}

### Installation and setup

#### Scaffold

The scaffold-command will copy a template to an empty project-directory. It will not overwrite
existing files.

Oneliner, inside your (empty) project folder:

```
yarn add @kaliber/build && ./node_modules/.bin/kaliber-scaffold && yarn start
```

Step by step, inside your (empty) project folder:
```
yarn add @kaliber/build

./node_modules/.bin/kaliber-scaffold

yarn start
```

Note that this is a template for a static site.

#### Manual

```js
yarn add @kaliber/build
yarn add npm-run-all // (optional) only used for the start script
```

Add scripts to `package.json`
```json
{
  "scripts": {
    "start": "run-p watch serve.dev",
    "watch": "CONFIG_ENV=dev kaliber-watch",
    "build": "NODE_ENV=production kaliber-build",
    "serve": "NODE_ENV=production kaliber-serve",
    "serve.dev": "PORT=8000 CONFIG_ENV=dev kaliber-serve"
  }
}
```

Create a `config/` directory with a `dev.js` file:

```js
module.exports = {}
```

Create a `src/` directory with an `index.html.js` file:

```jsx
export default (
  <html>
    <head />
    <body>Hello world!</body>
  </html>
)
```

| Description                                                   | Command                                   |
| :------------------------------------------------------------ | :---------------------------------------- |
| Development                                                   | `yarn start`                              |
| build production package with `dev` configuration             | `CONFIG_ENV=dev yarn run build`           |
| serve production mode with `dev` configuration at port `8000` | `CONFIG_ENV=dev PORT=8000 yarn run serve` |

### Choosing the project type

This library supports different types of projects.

- [Static sites](/how-to/static-site) vs [Server side rendering](/how-to/server-side-rendering)
- [Single page application](/how-to/single-page-application) vs [Isomorphic (Universal) javascript](/how-to/ismorphic-javascript)
- [Built in server](/server) vs Other server (for example [PHP with Wordpress](/how-to/wordpress))
