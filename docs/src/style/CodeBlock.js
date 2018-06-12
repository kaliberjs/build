import SyntaxHighlighter, { registerLanguage } from 'react-syntax-highlighter/light'
import docco from 'react-syntax-highlighter/styles/hljs/docco'

import js from 'react-syntax-highlighter/languages/hljs/javascript'
import css from 'react-syntax-highlighter/languages/hljs/css'

registerLanguage('js', js)
registerLanguage('css', css)

export default function CodeBlock({ language, value, ...props }) {
  return <SyntaxHighlighter language={language} style={docco} {...props}>{value}</SyntaxHighlighter>
}

export function JavaScript({ children, ...props }) {
  return <CodeBlock language='js' value={children} {...props} />
}

export function Css({ children, ...props }) {
  return <CodeBlock language='css' value={children} {...props} />
}
