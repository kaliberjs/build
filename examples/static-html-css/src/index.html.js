import { main } from 'main.css'
import bg1 from 'images/bg1.jpg'

export default (
  <html>
    <head>
      <link rel='stylesheet' href='/index.css' />
    </head>
    <body>
      <span className={ main }>Hello World!</span>
      <p><img src={ bg1 } /></p>
      <p>
        <ul>
          <li><a href='faq'>FAQ</a></li>
          <li><a href='about'>About us</a></li>
        </ul>
      </p>
    </body>
  </html>
)