import { Home } from '/pages/Home'

export default function App({ config }) {
  // contexts or a router might be set up here
  return (
    <AppProviders {...{ config }}>
      <Home />
    </AppProviders>
  )
}

function AppProviders({ children }) {

}
