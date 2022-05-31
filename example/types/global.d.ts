declare const React: typeof import('react')
declare const cx: typeof import('classnames').default

declare module '*.css' {
  const x: { [any: string]: string }
  export default x
}

interface Window {
  'Rollbar': import('rollbar'),
  dataLayer: Array<Object>
}

declare module '*.po'

declare module '*.raw.svg' {
  const x: string
  export default x
}
