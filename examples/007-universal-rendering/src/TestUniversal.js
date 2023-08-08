export function TestUniversal({ title }) {
  return <div>Named export: {title}</div>
}

export default function DefaultUniversal({ title }) {
  return <div>Default export: {title}</div>
}
