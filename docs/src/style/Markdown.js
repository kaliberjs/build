import ReactMarkdown from 'react-markdown'
import CodeBlock from '/style/CodeBlock'

export default function Markdown({ children }) {
  return <ReactMarkdown source={children} renderers={{code: CodeBlock}} />
}
