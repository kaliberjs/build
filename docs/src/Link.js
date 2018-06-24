import PublicPath from '/PublicPath'

export default function Link({ title, to, active }) {
  return (
    <PublicPath.Consumer>
      { publicPath => <a href={`${publicPath}${to.slice(1)}`} onClick={onClick}>{title}{active && ' >'}</a> }
    </PublicPath.Consumer>
  )

  function onClick(e) {
    e.preventDefault()
    window.history.pushState(null, title, e.currentTarget.href)
  }
}
