import ReactMarkdown from 'react-markdown'
// import SyntaxHighlighter from 'react-syntax-highlighter'
// import { docco } from 'react-syntax-highlighter/styles/hljs'
import SyntaxHighlighter, { registerLanguage } from "react-syntax-highlighter/light";
import js from 'react-syntax-highlighter/languages/hljs/javascript';
import css from 'react-syntax-highlighter/languages/hljs/css';
import docco from 'react-syntax-highlighter/styles/hljs/docco'; 

registerLanguage('js', js)
registerLanguage('css', css)

export default function Markdown({ children }) {
  return <ReactMarkdown source={children} renderers={{code: CodeBlock}} />
}

function CodeBlock({ language, value }) {
  return <SyntaxHighlighter language={language} style={docco}>{value}</SyntaxHighlighter>
}