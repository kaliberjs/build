import styles from './Section.css'

export function Section({ children }) {
  return <section className={styles.component}>{children}</section>
}
