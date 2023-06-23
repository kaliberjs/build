export default function dynamicTest(props) {
  return { props: Object.entries(props).map(([k, v]) => ({ [k]: v })) }
}
