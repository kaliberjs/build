import config from '@kaliber/config'

const { kaliber: { publicPath } } = config

export default (
  <html lang='en'>
    <head>
      <meta charSet='utf-8' />
      <title>@kaliber/build</title>
      <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
      <script type='text/javascript' dangerouslySetInnerHTML={{__html:
        `document.location.replace('${publicPath}#' + document.location.pathname.replace('${publicPath}', '') + document.location.hash)`
      }} />
    </head>
    <body><div>404</div></body>
  </html>
)
