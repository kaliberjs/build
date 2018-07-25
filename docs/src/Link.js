import PublicPath from '/PublicPath'
import styles from './style.css'

export default function Link({ title, to, active }) {
  return (
    <PublicPath.Consumer>
      { publicPath => <a href={`${publicPath}${to.slice(1)}`} onClick={onClick} className={active && styles.active}>{title}</a> }
    </PublicPath.Consumer>
  )

  function onClick(e) {
    e.preventDefault()
    window.history.pushState(null, title, e.currentTarget.href)
  }
}
