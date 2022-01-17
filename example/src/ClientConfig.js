/** @type {React.Context<any>} */
const clientConfigContext = React.createContext({})

export function ClientConfigProvider({ children, config }) {
  return <clientConfigContext.Provider value={config} {...{ children }} />
}

export function useClientConfig() {
  return React.useContext(clientConfigContext)
}
