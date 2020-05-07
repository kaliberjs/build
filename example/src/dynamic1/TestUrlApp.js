export default function TestUrlApp() {
  const [pathname, setPathname] = React.useState('unknown')

  React.useEffect(
    () => { setPathname(window.location.pathname) },
    []
  )

  return (
    <div>{pathname}</div>
  )
}
