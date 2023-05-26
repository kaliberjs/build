import SyntaxHighlighter from 'react-syntax-highlighter/dist/cjs/prism-light'
import prism from 'react-syntax-highlighter/dist/cjs/styles/prism/prism'

import js from 'react-syntax-highlighter/dist/cjs/languages/prism/javascript'
import css from 'react-syntax-highlighter/dist/cjs/languages/prism/css'
import jsx from 'react-syntax-highlighter/dist/cjs/languages/prism/jsx'
import php from 'react-syntax-highlighter/dist/cjs/languages/prism/php'
import markupTemplating from 'react-syntax-highlighter/dist/cjs/languages/prism/markup-templating'
import json from 'react-syntax-highlighter/dist/cjs/languages/prism/json'

SyntaxHighlighter.registerLanguage('js', js)
SyntaxHighlighter.registerLanguage('css', css)
SyntaxHighlighter.registerLanguage('jsx', jsx)
SyntaxHighlighter.registerLanguage('php', php)
SyntaxHighlighter.registerLanguage('markup-templating', markupTemplating) // for php
SyntaxHighlighter.registerLanguage('json', json)

export default function CodeBlock({ language, value, ...props }) {
  return <SyntaxHighlighter language={language} style={prism} {...props}>{value}</SyntaxHighlighter>
}

export function JavaScript({ children, ...props }) {
  return <CodeBlock language='js' value={children} {...props} />
}

export function Css({ children, ...props }) {
  return <CodeBlock language='css' value={children} {...props} />
}
