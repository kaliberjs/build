import head from 'partials/head'
import styles from './test.css' // eslint-disable-line no-unused-vars
import Test from 'partials/Test?universal'

export default (
  <html>{head('test')}<body><Test />Test</body></html>
)
