import head from '/partials/head'
import Test from '/partials/Test?universal'

export default function() {
  return <html>{head('test')}<body><Test />Test</body></html>
}
