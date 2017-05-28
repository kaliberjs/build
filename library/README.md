**This package is not ready for public consumption**

# Kaliber.js build

An opinionated zero configuration build stack with React, PostCSS, Babel and Webpack as major ingredients.

## Installation

```
yarn add @kaliber/build
```

`package.json`:
```
{
  "scripts": {
    "build": "kaliber-build",
    "watch": "kaliber-watch",
    "serve": "PORT=8000 kaliber-serve"
  }
}
```

## Features

- Static React templates
- Dynamic (server side rendered) React templates
- Easy universal rendering
- CSS modules and CSS merging
- Source map support
- Hot module replacement support
- Image support

## Conventions

Ruby popularized 'convention over configuration', this library has a set of conventions. If you disagree with a convention please open an issue so we can discuss it.

- `src` - Source files live in the `src` directory
- `target` - Compiled / processed files are stored in the `target` directory
- `src/public` - Files in this directory do not need to be included in an entry (will not process `.js` files).
- `**/*.entry.js` - Compiled as a separate `.js` entry
- `**/*.entry.css` - Compiled as a separate `.css` entry
- `**/*.html.js`
  - `static` - Considered `static` when JSX is exported, results in `*.html`
  - `dynamic` - Considered `dynamic` when a function is exported, results in `*.html.js`
- `npm run *` - Expecting these commands to be called from the directory that contains `src` and `target`
- `*.css` - CSS is allways compiled with module support, for each standalone CSS files a `.json` file is generated containing the class names.

## Known issues

Please check the list of open issues.

## Usage (static pages)

`src/index.html.js`
```
import head from './partials/head'
import styles from './main.html.css'

export default (
  <html>
    { head("Test title") }
    <body className={styles.background}>
      <p className={styles.context}>Test</p>
    </body>
  </html>
)
```
All css files used are combined into `index.css` if the entry was called `index.html.js`.

## Usage (dynamic pages)

`src/index.html.js`
```
import head from './partials/head'
import styles from './index.html.css'

main.routes = {
  match: location => Promise.resolve({ status: ..., data: ... })
}

export default main

function main(({ location, data })) {
  return (
    <html>
      { head('Test title') }
      <body className={styles.background}>
        <p className={styles.context}>Test</p>
        { data }
      </body>
    </html>
  )
}
```

## Usage (universal rendering)

```
import head from './partials/head'
import Test from './partials/Test?universal' // Import the component with `?universal` to turn it into a universal component

export default (
  <html>
    { head("Test title") }
    <body>
      <Test prop='value' />
    </body>
  </html>
)
```

Note that universal rendering will change the html structure slightly (wrap an extra `div`), this can probably be changed when React 16 is released with array support.

## Motivation

At Kaliber we have created a lot of different projects over the years, each using a different set of technologies that seemed more suitable for the task. This library is an attempt to reduce the number of technologies required to build a website. We have created this library with three use cases in mind:

1. Static pages
2. Single page applications
3. Wordpress sites 

The second motivation for this project is the amount of time that was spent to set up a projects build stack. Some of our projects use Gulp, others use Webpack. It all felt way too complicated, slow or fit for a single purpose. We eventually chose webpack and created some loaders and plugins that are easier to understand than the ones that were available by default. The code in this library is not simple per-se, but it contains a lot less lines of codes compared to the alternatives.

This library is for Kaliber, we chose a set of conventions and configurations that work for us. These choices sacrifice configurability for consistency and ease of use.

## Publish

To publish a new version:

```
>yarn publish

>git push

>git push --tags
```
