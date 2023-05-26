import { LinkText } from '/components/buildingBlocks/Link'
import styles from './Intro.css'
import logo from './logo.svg'

export function Intro({ children }) {
  return (
    <div className={styles.component}>
      <div className={styles.logoWrapper}><img src={logo} alt='Kaliber logo' /></div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}

export function IntroLink({ to, children, target }) {
  return <span className={styles.componentLink}><LinkText {...{ to, children, target }} /></span>
}
