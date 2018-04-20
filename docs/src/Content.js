import Markdown from '/Markdown'

export default function Content({ children }) {
  if (typeof children === 'string') return <Markdown>{children}</Markdown>
  else return children
}