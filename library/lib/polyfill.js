const isProduction = process.env.NODE_ENV === 'production'

export default function polyfill(features = []) {
  return isProduction
    ? <script defer src={`https://cdn.polyfill.io/v2/polyfill.min.js?rum=0&features=${features.join(',')}`} crossorigin="anonymous" />
    : <script defer src={`https://cdn.polyfill.io/v2/polyfill.js?rum=0&features=${features.join(',')}`} crossorigin="anonymous" />
}
