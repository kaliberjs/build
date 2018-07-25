import Link from '/Link'

export default function Menu({ pages, page }) {
  return (
    <ul>
      {pages.map(([id, title, contentOrSubItems]) =>
        <li key={id}>
          {
            Array.isArray(contentOrSubItems)
              ? (
                <React.Fragment>
                  {title}
                  <ul>
                    {
                      contentOrSubItems.map(([subId, title]) =>
                        <li key={subId}>
                          <Link to={`/${id}/${subId}`} title={title} active={page === `${id}/${subId}`} />
                        </li>
                      )
                    }
                  </ul>
                </React.Fragment>
              )
              : <Link to={`/${id}`} title={title} active={page === id} />
          }
        </li>
      )}
    </ul>
  )
}

