const isProduction = process.env.NODE_ENV === 'production'

export default function polyfill(features = []) {
  const src = isProduction
    ? `https://polyfill-fastly.io/v3/polyfill.min.js?features=${features.join(',')}&flags=gated&rum=0&unknown=polyfill`
    : `https://polyfill-fastly.io/v3/polyfill.js?features=${features.join(',')}&flags=gated&rum=0&unknown=polyfill`
  return <script src={src} crossOrigin="anonymous" />
}
