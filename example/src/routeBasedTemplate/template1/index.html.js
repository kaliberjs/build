import head from '/partials/head'

export default function Index({ location, data }) {
  return (
    <html lang='en'>
      {head('Template 1')}
      <body>
        Template 1
        <p>{JSON.stringify(data)}</p>
      </body>
    </html>
  )
}
