## Introduction

The `@kaliber/build` is the single dependency you need to create a website. It contains a modern
build stack and a small server. It's designed to function without any configuration.

The consequence of this design decision is that this library is very opinionated and leans very
heavily on conventions. We however embrace conversation, so if you think we need to change something
please open an issue.

{toc}

### Use cases

There a quite a lot of ways you can use this library. A handful of use cases:

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

#### A static site with javascript in the browser

Server side rendering is the default, but switching to a universal component is very easy: simply
add `?universal` to your import.

```jsx
import MyComponent from '/MyComponent?universal'
import Page from '/Page'

export default (
  <Page>
    <MyComponent title='Hello world!' flashInterval={1000} />
  </Page>
)
```

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


### Features

Some notable features:

- Hot reloading
- Fingerprinting
- Server

### Technology

Currently our
