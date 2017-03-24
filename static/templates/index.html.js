import head from './partials/head'
import styles from './index.css'

export default (
	<html>
		{  head("Some title") }
		<body>
			Test
			<span class={styles.test}>Something</span>
		</body>
	</html>
)