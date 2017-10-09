import head from 'partials/head'
import styles from './test.css'
import Test from 'partials/Test?universal'
import config from '@kaliber/config'
import shared from '/partials/shared'
import SharedComponent from '/partials/SharedComponent?universal'

export default (
	<html>{head('test')}<body>
    {shared}
    <SharedComponent />
    Test
    <Test clientConfig={config.client} />
    </body></html>
)
