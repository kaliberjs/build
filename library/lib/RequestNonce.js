// const requestNonceContext = React.createContext(null)

// export function RequestNonceProvider({ value, children }) {
//   return <requestNonceContext.Provider {...{ value, children }} />
// }

// export function useRequestNonce() {
//   const value = React.useContext(requestNonceContext)
//   if (!value) throw new Error(
//     `Missing request nonce, two possible causes:\n` +
//     `  1. <RequestNonceProvider /> is missing in 'index.html.js'\n` +
//     `  2. A universal component was nested in another universal component`
//   )

//   return value
// }
