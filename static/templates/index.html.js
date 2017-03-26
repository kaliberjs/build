import head from './partials/head'
import Test from './partials/Test?universal'
import styles from './index.html.js.css'

console.log("============")
console.log(Test)

export default (
	<html>
		{ head("Some title") }
		<body>
			<p className={styles.test2}>Test</p>
			<span className={styles.test}>Something</span>
      <Test soep='kip' />
		</body>
	</html>
)