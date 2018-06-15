export default function Menu({ pages, page, publicPath }) {
  return (
    <ol>
      {pages.map(([id, title, contentOrSubItems]) =>
        <li key={id}>
          {
            Array.isArray(contentOrSubItems)
              ? (
                <React.Fragment>
                  {title}
                  <ol>
                    {
                      contentOrSubItems.map(([subId, title]) =>
                        <li key={subId}>
                          <Link to={`${id}/${subId}`} title={title} active={page === `${id}/${subId}`} />
                        </li>
                      )
                    }
                  </ol>
                </React.Fragment>
              )
              : <Link to={id} title={title} active={page === id} />
          }
        </li>
      )}
    </ol>
  )
  function Link({ title, to, active }) {
    const href = `${publicPath}${to}`
    return <a href={href} onClick={onClick}>{title}{active && ' >'}</a>
    function onClick(e) {
      e.preventDefault()
      window.history.pushState(null, title, href)
    }
  }
}

