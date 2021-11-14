import styles from './FunctionComponent.css'

export function FunctionComponent({ prop1, prop2 }) {
  const [counter, setCounter] = React.useState(0)
  const [clickCounter, setClickCounter] = React.useState(0)
  const counterRef = React.useRef(0)

  counterRef.current = counter

  React.useEffect(
    () => {
      console.log('mount')
      const interval = setInterval(tick, 1000)
      return () => {
        console.log('unmount')
        clearInterval(interval)
      }

      function tick() {
        if (counterRef.current > 3) clearInterval(interval)
        console.log('tick')
        setCounter((x) => x + 1)
      }
    },
    []
  )

  return (
    <>
      <h1>Function component</h1>
      <p>{prop1} / {prop2}</p>
      <p>first {counter}</p>
      <p>{Boolean(counter % 2) && <strong>second</strong>} {counter}</p>
      {/* this use case does not work (top level element appearance / disappearance):
      {Boolean(counter % 2) && <p>third {counter}</p>}
      */}
      <p>
        <button
          type='button'
          onClick={_ => {
            console.log('click')
            setClickCounter(x => x + 1)
          }}
        >
          click - {clickCounter}
        </button>
      </p>
    </>
  )
}

export function FunctionComponentContainer({ children }) {
  return <div className={styles.componentContainer}>{children}</div>
}
