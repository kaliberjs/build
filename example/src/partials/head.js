import styles from './head.css'
import x from 'test/test.entry'
import y from 'test/test.css'

export default function(title) {
	return (
		<head>
			<title>{title}</title>
      { /* we might be able to inject these (or supply them as props) */}
      <link href='/index.css' rel='stylesheet' type='text/css' />
      <link href='https://cdnjs.cloudflare.com/ajax/libs/normalize/7.0.0/normalize.css' rel='stylesheet' type='text/css' />
      <script src='https://unpkg.com/react@15/dist/react.js' />
      <script src='https://unpkg.com/react-dom@15/dist/react-dom.js' />
		</head>
	)
}