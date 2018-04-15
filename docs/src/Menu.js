export default function Menu({ pages, page }) {
  return (
    <ol>
      {pages.map(([id, title]) => <li key={id}><a href={'#' + id}>{title}{page === id && ' >'}</a></li> )}
    </ol>
  )

}
