import ReactMarkdown from 'react-markdown'
import CodeBlock from '/style/CodeBlock'
import Link from '/Link'

export default function Markdown({ children }) {
  return <ReactMarkdown source={children} renderers={{
    root: RootWithTableOfContents,
    code: CodeBlock,
    heading: Heading,
    link: A,
  }} />
}

function A({ href, children }) {
  console.log(href, children)
  return href.startsWith('/')
    ? <Link to={href} title={React.Children.only(<React.Fragment>{children}</React.Fragment>)} />
    : <a href={href}>{children}</a>
}

function Heading({ level, children }) {
  const [title] = children
  const props = { id: Heading.id(title) }
  return React.createElement(`h${level}`, props, children)
}

Heading.id = function id(value) {
  const title = typeof value === 'string'
    ? value
    : value.props.children

  return title.toLowerCase().replace(/ /g, '-')
}

function RootWithTableOfContents({ children }) {
  const toc = []
  return (
    <React.Fragment>
      {React.Children.map(children, x => {
        if (x.type === 'p') {
          const [text] = x.props.children
          if (text === '{toc}') return <Toc />
        }
        if (x.type === Heading) {
          toc.push(x.props)
        }
        return x
      })}
    </React.Fragment>
  )

  function Toc() {
    return <TocList list={toc} />

    function TocList({ list }) {
      const minLevel = 3
      return (
        <React.Fragment>
          <p><strong>On this page:</strong></p>
          {list.filter(x => x.level >= minLevel).map(({ level, children }, i) => {
            const [title] = children
            const id = Heading.id(title)

            return (
              <React.Fragment key={id + i}>
                <a style={{ paddingLeft: ((level - minLevel) * 10) + 'px' }} href={'#' + encodeURIComponent(id)}>{title}</a>
                <br />
              </React.Fragment>
            )
          })}
        </React.Fragment>
      )
    }
  }
}
