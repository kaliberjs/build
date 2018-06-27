
## Introduction

The `@kaliber/build` library is the single dependency you need to create a website. It contains a
modern build stack and a small server. It's designed to function without any configuration.

The consequence of this design decision is that this library is very opinionated and leans very
heavily on conventions. However, we embrace conversation, so if you think we need to change something
please open an issue.

{toc}

### Use cases

There are quite a lot of ways you can use this library. A handful of use cases:

#### A simple static site

You write your html with help of React using all conveniences of modern javascript syntax. The css
is written in using modern css.

```jsx
import stylesheet from '@kaliber/build/stylesheet'
import styles from '/main.css'

export default (
  <html>
    <head>
      {stylesheet}
    </head>
    <body>
      <h1>Hello world!</h1>
      <div className={styles.body}>How are you doing?</div>
    </body>
  </html>
)
```

Read more at [how-to: static site](/how-to/static-site)

#### A static site with javascript in the browser

Server side rendering is the default, but switching to a universal/isomorphic component is very
easy: simply add `?universal` to your import.

```jsx
import MyComponent from '/MyComponent?universal'
import Page from '/Page'

export default (
  <Page>
    <MyComponent title='Hello world!' flashInterval={1000} />
  </Page>
)
```

Read more at [how-to: isomorphic javascript](/how-to/isomorphic-javascript)

#### A dynamic site with content based on the location

Sometimes you want to show different content based on the given location, but you don't want to
create separate html pages for each location.

```jsx
import Page from '/Page'

export default ({ location }) => (
  <Page>
    location.pathname === '/part1'
      ? <Part1 />
      : <Part2 />
  </Page>
)
```

Read more at [how-to: server side rendering](/how-to/server-side-rendering)

#### A dynamic site with dynamic data

A lot of sites require content to be fetched from some sort of CMS. In most cases some form of
identifier is available in the url. On top of that, things change, so you might need to redirect.

```jsx
index.routes = {
  match: async location => {
    const { pathname } = location

    if (pathname.startsWith('/article/')) {
      const [id] = pathname.split('/').slice(2)
      const data = await fetchArticle(id)

      if (data) return { status: 200, data }
      else return { status: 404 }
    }

    const oldArticles = '/articles'
    if (pathname.startsWith(oldArticles)) {
      return { status: 301, headers: { Location: '/article' + pathname.replace(oldArticles) }}
    }

    return { status: 404 }
  }
}

export default function index(({ location, data })) {
  return ...
}
```

Read more at [how-to: server side rendering](/how-to/server-side-rendering)

#### Just modern css and javascript

In some cases you already have a framework in place to handle the rendering of your html. This
library can also be used to simply enable you to write modern javascript and css. Simply create a
`name.entry.js` or `name.entry.css` file and they will be picked up and transpiled along with
all of their dependencies.

Learn more at [conventions: entries](/conventions#entries)

#### Templating

Javascript can be a great template language for any output format. This library provides a way to
have javascript files turned into arbitrary other formats.

It consists of two parts:
1. The template renderer
2. The template

First step is to create a renderer (`/myRenderer.js`).

```js
export default function myRenderer(template) {
  // in real life, use a csv library
  return template.map(x => x.join(',')).join('\n') + '\n'
}
```

Register the renderer in the configuration.

```js
{
  kaliber: {
    templateRenderers: { csv: '/myRenderer' }
  }
}
```

Create a template (`/my.csv.js`).

```js
export default [
  ['a', 'b', 'c'],
  ['d', 'e', 'f'],
]
```

The result is a `my.csv` file:

```
a,b,c
d,e,f

```

Read more at [template renderers](/template-renderers)

#### More

This is the introduction page to give you a quick overview. There are quite a few use cases where
this library can help you. Explore the docs to see if your use case is supported. If it's not
please check the issues if it is not supported on purpose. No related issue? File one, we would love
to hear about your use case!


### Features

Some notable features:

#### Watch, build, serve

We provide 3 npm binaries that can be used in the `scripts` of your `package.json`:

- `kaliber-watch` - Starts the build process that will recompile when a file changes.
- `kaliber-build` - Creates a build (including minification)
- `kaliber-serve` - Starts a simple express server, usable for both developement and production

#### Easy universal rendering

What if I told you that making a component universal was as easy as adding `?universal` to it's
import statement?

Let's say you have the following static site:

```jsx
import MyComponent from '/MyComponent'

export default (
  <html>
    <head>...</head>
    <body>
      <MyComponent someProp='value' />
    </body>
  </html>
)
```

The contents of `MyComponent` are only rendered on the server and many of lifecycle methods that
are triggered in the client never happen (most notably `componentDidMount`). The only change I need
to make to be able to add dynamic stuff and start using `state` in my component is the following:

```jsx
import MyComponent from '/MyComponent?universal' // <--

export default (
  <html>
    <head>...</head>
    <body>
      <MyComponent someProp='value' />
    </body>
  </html>
)
```

Read more at [how-to: isomorphic javascript](/how-to/isomorphic-javascript)

#### Hot reloading without a dev server

The `kaliber-watch` process communicates directly with your browser. This means you can use hot
reloading in the javascript that is hosted in another framework.

As a side note, your CSS is also hot reloaded.

#### Asset fingerprinting

Caching is important and by far the best way to make sure the correct things are cached is by
fingerprinting the assets with a content based hash as a name. We fingerprint all assets that move
through the build tool. Don't worry, we also generate manifest files that allow you to obtain the
file names based on the original file name.

#### Server

The library comes with a small node.js server. This server can be used both in development as in
production.

Learn more at [server](/server)

#### Copying of unused files

The build tool copies all unused files in the source directory to the target directory. This allows
you to keep all files together.

#### Environment dependent configuration

By setting the `CONFIG_ENV` environment variable you determine what configuration to load. We also
support `default.js` and `local.js`.

Read more at [configuration](/configuration)

### Technology

Just a list.

- React
- Webpack
- Node.js
- Babel
- Eslint
- Postcss
- CssNext
- Express
- @kaliber/config

If you want to know why we picked these, read the section on [choices](/choices)
