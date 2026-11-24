import { useEffect, useRef, useState } from 'react'
import { DiscordIcon, GitHubIcon } from '../site/icons'
import { REPO_URL } from '../../lib/site'
import { fill, withLocale } from '../../lib/locales'
import type { Messages } from '../../lib/messages/en'

type Lang = {
  name: string
  file: string
  color: string
  code: string[]
  bridge: string
  proof?: { what: string; total: number }
}

const LANGS: Lang[] = [
  {
    name: 'TypeScript',
    file: 'src/words.ts',
    color: '#3178c6',
    code: ['export function wordCount(text: string): number {', '  return text.split(/\\s+/).filter(Boolean).length', '}'],
    bridge: 'napi-rs',
    proof: { what: 'Fuse.js', total: 3414 },
  },
  {
    name: 'JavaScript',
    file: 'lib/words.js',
    color: '#f7df1e',
    code: ['function wordCount(text) {', '  return text.split(/\\s+/).filter(Boolean).length', '}', '', 'module.exports = { wordCount }'],
    bridge: 'napi-rs',
    proof: { what: 'json-server', total: 514 },
  },
  {
    name: 'Python',
    file: 'words.py',
    color: '#ffd43b',
    code: ['def word_count(text: str) -> int:', '    return len(text.split())'],
    bridge: 'PyO3',
    proof: { what: 'CPython colorsys', total: 2400 },
  },
  {
    name: 'Go',
    file: 'words.go',
    color: '#00add8',
    code: ['func WordCount(text string) int {', '    return len(strings.Fields(text))', '}'],
    bridge: 'cgo',
    proof: { what: 'Go path', total: 2642 },
  },
  {
    name: 'Ruby',
    file: 'words.rb',
    color: '#cc342d',
    code: ['def word_count(text)', '  text.split.size', 'end'],
    bridge: 'magnus',
    proof: { what: 'shellwords', total: 1617 },
  },
  {
    name: 'Java',
    file: 'Words.java',
    color: '#f89820',
    code: ['static int wordCount(String text) {', '  String t = text.strip();', '  return t.isEmpty() ? 0 : t.split("\\\\s+").length;', '}'],
    bridge: 'JNI',
    proof: { what: 'JDK facade', total: 4492 },
  },
  {
    name: 'C',
    file: 'words.c',
    color: '#a8b9cc',
    code: [
      'int word_count(const char *s) {',
      '  int n = 0, in = 0;',
      '  for (; *s; s++)',
      '    if (isspace(*s)) in = 0;',
      '    else if (!in) { in = 1; n++; }',
      '  return n;',
      '}',
    ],
    bridge: 'extern "C"',
    proof: { what: 'glibc facade', total: 1859 },
  },
  {
    name: 'PHP',
    file: 'words.php',
    color: '#777bb4',
    code: ['function word_count(string $t): int {', "  return count(preg_split('/\\s+/', trim($t), -1,", '    PREG_SPLIT_NO_EMPTY));', '}'],
    bridge: 'ext-ffi',
    proof: { what: 'PEAR XML_Util', total: 1838 },
  },
  {
    name: 'C#',
    file: 'Words.cs',
    color: '#9b4f96',
    code: ['static int WordCount(string t) =>', '  t.Split((char[]?)null,', '    StringSplitOptions.RemoveEmptyEntries).Length;'],
    bridge: 'P/Invoke',
    proof: { what: 'Google.Protobuf', total: 2941 },
  },
  {
    name: 'Kotlin',
    file: 'Words.kt',
    color: '#7f52ff',
    code: ['fun wordCount(text: String): Int =', '  text.split(Regex("\\s+")).count { it.isNotEmpty() }'],
    bridge: 'JNI',
  },
  {
    name: 'PowerShell',
    file: 'Words.psm1',
    color: '#5391fe',
    code: ['function Get-WordCount([string]$Text) {', "  ($Text -split '\\s+' | Where-Object { $_ }).Count", '}'],
    bridge: 'P/Invoke',
  },
]

const RUST = ['pub fn word_count(text: &str) -> usize {', '    text.split_whitespace().count()', '}']

const TOKENS =
  /("[^"]*"|'[^']*')|\b(export|function|module|return|def|func|end|static|int|const|char|for|if|else|pub|fn|usize|number|string|str|String)\b/g

function Code({ line }: { line: string }) {
  const parts: React.ReactNode[] = []
  let last = 0
  let k = 0
  for (const m of line.matchAll(TOKENS)) {
    const at = m.index ?? 0
    if (at > last) parts.push(line.slice(last, at))
    parts.push(
      <span key={k++} className={m[1] ? 'tk-str' : 'tk-kw'}>
        {m[0]}
      </span>,
    )
    last = at + m[0].length
  }
  if (last < line.length) parts.push(line.slice(last))
  return <>{parts}</>
}

function useCount(target: number, run: number, delay: number) {
  const [n, setN] = useState(target)
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
      return
    }
    setN(0)
    let raf = 0
    const start = performance.now() + delay
    const tick = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - start) / 1300))
      setN(Math.round(target * (1 - Math.pow(1 - k, 3))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, delay])
  return n
}

const W = 200
const H = 240
const MID = H / 2
const BEAMS = [-60, -20, 20, 60].map(
  (o) => `M0,${MID + o} C60,${MID + o} 70,${MID} 100,${MID} C130,${MID} 140,${MID + o * 0.5} 200,${MID + o * 0.5}`,
)

export default function Hero({ t, locale = 'en' }: { t: Messages['hero']; locale?: string }) {
  const [i, setI] = useState(0)
  const [auto, setAuto] = useState(true)
  const [run, setRun] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const lang = LANGS[i]
  const count = useCount(lang.proof?.total ?? 0, run, 900)

  useEffect(() => {
    if (!auto || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = window.setTimeout(() => {
      setI((v) => (v + 1) % LANGS.length)
      setRun((r) => r + 1)
    }, 5200)
    return () => clearTimeout(t)
  }, [auto, i])

  const pick = (n: number) => {
    setAuto(false)
    setI(n)
    setRun((r) => r + 1)
  }

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const n = (i + (e.key === 'ArrowRight' ? 1 : LANGS.length - 1)) % LANGS.length
    pick(n)
    tabs.current[n]?.focus()
  }

  return (
    <section className="ox-hero" aria-labelledby="hero-title">
      <div className="ox-grid" aria-hidden />
      <div className="ox-glow" aria-hidden />
      <div className="wrap ox-inner">
        <h1 id="hero-title">
          {t.title1}
          <span className="line2">{t.title2}</span>
        </h1>
        <p className="sub">{t.sub}</p>
        <div className="actions">
          <a className="btn btn-primary" href={withLocale('/docs/introduction/quick-start', locale)}>
            {t.cta}
          </a>
          <a className="btn btn-quiet" href={REPO_URL}>
            <GitHubIcon />
            {t.source}
          </a>
          <a className="btn btn-quiet" href="https://discord.gg/FXhUEA8eBR">
            <DiscordIcon />
            {t.discord}
          </a>
        </div>

        <div className="stage">
          <div className="lang-tabs" role="tablist" aria-label={t.sourceLanguage} onKeyDown={onKey}>
            {LANGS.map((l, n) => (
              <button
                key={l.name}
                ref={(el) => {
                  tabs.current[n] = el
                }}
                role="tab"
                type="button"
                aria-selected={n === i}
                tabIndex={n === i ? 0 : -1}
                className={`lang-tab${n === i ? ' on' : ''}`}
                style={{ ['--chip' as string]: l.color }}
                onClick={() => pick(n)}
              >
                <span className="dot" />
                {l.name}
                {n === i && auto && <span className="timer" key={run} aria-hidden />}
              </button>
            ))}
          </div>

          <div className="stage-grid" key={run}>
            <div className="pane src">
              <div className="pane-head">
                <span className="dot" style={{ background: lang.color }} />
                {lang.file}
              </div>
              <pre>
                {lang.code.map((l, n) => (
                  <span key={n} className="ln" style={{ animationDelay: `${n * 70}ms` }}>
                    <Code line={l} />
                  </span>
                ))}
              </pre>
            </div>

            <div className="beam" aria-hidden>
              <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
                {BEAMS.map((d, n) => (
                  <path key={n} d={d} className="beam-line" />
                ))}
                {BEAMS.map((d, n) => (
                  <path key={`p${n}`} d={d} pathLength={1000} className="beam-pulse" style={{ animationDelay: `${n * -0.45}s` }} />
                ))}
              </svg>
              <div className="core">
                <img src="/crab-hero.png" width={150} height={150} alt="" />
              </div>
            </div>

            <div className="pane rs">
              <div className="pane-head">
                <span className="dot" style={{ background: '#e0763f' }} />
                src/port.rs
                <span className="via">{t.bridge}: {lang.bridge}</span>
              </div>
              <pre className="scan">
                {RUST.map((l, n) => (
                  <span key={n} className="ln rs-ln" style={{ animationDelay: `${520 + n * 120}ms` }}>
                    <Code line={l} />
                  </span>
                ))}
              </pre>
            </div>
          </div>

          <div className="verdict" aria-live="polite">
            {lang.proof ? (
              <>
                <span className="tick" aria-hidden>
                  ✓
                </span>
                <span>
                  {fill(t.verified, {
                    lang: lang.name,
                    what: lang.proof.what,
                    count: `${count.toLocaleString('en-US')} / ${lang.proof.total.toLocaleString('en-US')}`,
                  })}
                </span>
              </>
            ) : (
              <span>{fill(t.tested, { lang: lang.name })}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
