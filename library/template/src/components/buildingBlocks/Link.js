import styles from './Link.css'

export { LinkBase as Link }

export function LinkText({ to, children, target = undefined, rel = undefined }) {
  return <LinkBase className={styles.componentText} {...{ to, children, target, rel }} />
}

export function LinkBlock({ to, children, target = undefined, rel = undefined }) {
  return <LinkBase className={styles.componentBlock} {...{ to, children, target, rel }} />
}

function LinkBase({ to, children, className, target, rel }) {
  const safeRel = target === '_blank' ? `${rel || ''} noopener noreferrer` : rel
  return <a href={to} rel={safeRel} className={cx(styles.componentBase, className)} {...{ target }}>{children}</a>
}
