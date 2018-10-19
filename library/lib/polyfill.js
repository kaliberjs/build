export default function polyfill(features = [], { minify = true } = {}) {
  return minify
    ? <script defer src={`https://cdn.polyfill.io/v2/polyfill.min.js?features=${features.join(',')}`} crossorigin="anonymous" />
    : <script defer src={`https://cdn.polyfill.io/v2/polyfill.js?features=${features.join(',')}`} crossorigin="anonymous" />
}
