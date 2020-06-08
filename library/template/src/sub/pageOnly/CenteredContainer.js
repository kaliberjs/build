import { oneOf, node } from 'prop-types'
import styles from './CenteredContainer.css'

CenteredContainer.propTypes = {
  size: oneOf(['sm', 'md', 'lg']).isRequired,
  children: node
}

export function CenteredContainer({ children, size }) {
  return (
    <div className={styles.component}>
      <div className={styles[size]}>{children}</div>
    </div>
  )
}
