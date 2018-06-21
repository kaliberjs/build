import example from './example.raw'
import { JavaScript } from '/style/CodeBlock';
import Markdown from '/style/Markdown'

export default (
  <React.Fragment>
    <Markdown>
      - minimum requirements
      - project type
      - scaffold
      - manual
      - overview of the documentation
      - never import React and React.Component
    </Markdown>
    <JavaScript>{example}</JavaScript>
  </React.Fragment>
)
