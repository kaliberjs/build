const isProduction = process.env.NODE_ENV === 'production'

export default function polyfill(features = []) {
  const src = isProduction
    ? `https://cdn.polyfill.io/v3/polyfill.min.js?rum=0&unknown=polyfill&flags=gated&features=${features.join(',')}`
    : `https://cdn.polyfill.io/v3/polyfill.js?rum=0&unknown=polyfill&flags=gated&features=${features.join(',')}`
  return <script src={src} crossOrigin="anonymous" />
}
