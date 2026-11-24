import { withLocale } from '../lib/locales'

const TOKEN = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g

export default function Rich({ text, locale }: { text: string; locale?: string }) {
  const out: React.ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of text.matchAll(TOKEN)) {
    const at = m.index ?? 0
    if (at > last) out.push(text.slice(last, at))
    if (m[1] !== undefined) out.push(<code key={k++}>{m[1]}</code>)
    else {
      const href = locale ? withLocale(m[3], locale) : m[3]
      out.push(
        <a key={k++} href={href}>
          {m[2]}
        </a>,
      )
    }
    last = at + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}
