import styles from './Container.css'

export function ContainerSm({ children }) {
  return <ContainerBase className={styles.componentSm} {...{ children }} />
}

export function ContainerMd({ children }) {
  return <ContainerBase className={styles.componentMd} {...{ children }} />
}

export function ContainerLg({ children }) {
  return <ContainerBase className={styles.componentLg} {...{ children }} />
}

function ContainerBase({ className, children }) {
  return (
    <div className={cx(className, styles.componentBase)}>
      <div>{children}</div>
    </div>
  )
}
