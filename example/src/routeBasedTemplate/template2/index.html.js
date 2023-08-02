import head from '/partials/head'

export default function Index({ location, data }) {
  return (
    <html lang='en'>
      {head('Template 2')}
      <body>
        Template 2
        <p>{JSON.stringify(data)}</p>
      </body>
    </html>
  )
}
