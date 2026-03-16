import index from './index' // @ts-ignore
import README from './README.md?raw' // @ts-ignore
import README_JA from './README.ja.md?raw'
import markdownit from 'markdown-it'
import mermaid from 'mermaid'
import React from 'react'
import { createPortal } from 'react-dom'
import { createRoot } from 'react-dom/client'
import { LiveEditor, LiveError, LivePreview, LiveProvider } from 'react-live'
import { themes } from 'prism-react-renderer'
import './main.css'

type CodeBlockProps = { code: string; language: string; inline?: string }
type Node = { id: string; label: string; href?: string; note?: string; action?: () => void; children?: Node[] }
type Layers = Record<string, number>
type Legend = Record<string, string>

const runtime: { render?: (lang: 'en' | 'ja') => void } = {}

const menuTree: Node[] = [
        {
                id: 'docs',
                label: 'Docs',
                children: [
                        { id: 'lang-en', label: 'English', note: 'README.md', action: () => runtime.render?.('en') },
                        { id: 'lang-ja', label: '日本語', note: 'README.ja.md', action: () => runtime.render?.('ja') },
                ],
        },
        {
                id: 'links',
                label: 'Links',
                children: [
                        { id: 'github', label: 'GitHub', note: 'Source', href: 'https://github.com/tseijp/z-idx' },
                        { id: 'npm', label: 'npm', note: 'Package', href: 'https://www.npmjs.com/package/z-idx' },
                        { id: 'twitter', label: '@tseijp', note: 'Author', href: 'https://twitter.com/tseijp' },
                ],
        },
        {
                id: 'cases',
                label: 'Suites',
                children: [
                        {
                                id: 'pair',
                                label: '0.x pairs',
                                children: [
                                        { id: 'pair-basics', label: 'pair-basics', href: 'https://github.com/tseijp/z-idx/blob/main/0.0.pair-basics.test.ts' },
                                        { id: 'pair-recursion', label: 'pair-recursion', href: 'https://github.com/tseijp/z-idx/blob/main/0.1.pair-recursion.test.ts' },
                                        { id: 'pair-inference', label: 'pair-inference', href: 'https://github.com/tseijp/z-idx/blob/main/0.2.pair-inference.test.ts' },
                                ],
                        },
                        {
                                id: 'topo',
                                label: '1.x topo',
                                children: [
                                        { id: 'topo-three', label: 'topo-three-nodes', href: 'https://github.com/tseijp/z-idx/blob/main/1.0.topo-three-nodes.test.ts' },
                                        { id: 'topo-four', label: 'topo-four-nodes', href: 'https://github.com/tseijp/z-idx/blob/main/1.1.topo-four-nodes.test.ts' },
                                        { id: 'topo-five', label: 'topo-five-nodes', href: 'https://github.com/tseijp/z-idx/blob/main/1.2.topo-five-nodes.test.ts' },
                                ],
                        },
                        {
                                id: 'ext',
                                label: '2.x extensions',
                                children: [
                                        { id: 'ext-stability', label: 'extension-stability', href: 'https://github.com/tseijp/z-idx/blob/main/2.0.extension-stability.test.ts' },
                                        { id: 'ext-density', label: 'extension-density', href: 'https://github.com/tseijp/z-idx/blob/main/2.1.extension-density.test.ts' },
                                        { id: 'ext-packing', label: 'extension-packing', href: 'https://github.com/tseijp/z-idx/blob/main/2.2.extension-packing.test.ts' },
                                ],
                        },
                ],
        },
        {
                id: 'lab',
                label: 'Lab',
                children: [
                        { id: 'play', label: 'Live sandbox', note: 'Tweak ranks here' },
                        { id: 'switch', label: 'Flip language', note: 'Reset + remount', action: () => runtime.render?.('ja') },
                        { id: 'repo', label: 'Open repo', note: 'Browse commits', href: 'https://github.com/tseijp/z-idx/commits/main' },
                ],
        },
        {
                id: 'toc',
                label: 'TOC',
                children: [
                        {
                                id: 'toc-rationale',
                                label: 'Rationale',
                                href: '#rationale',
                                children: [
                                        { id: 'toc-core', label: 'Core Concepts', href: '#core-concepts' },
                                        { id: 'toc-type', label: 'Type Inference', href: '#type-inference' },
                                        { id: 'toc-api', label: 'API Surface', href: '#api-surface' },
                                ],
                        },
                        {
                                id: 'toc-pairs',
                                label: 'Pair Catalogue',
                                href: '#pair-catalogue',
                                children: [
                                        { id: 'toc-pair-basics', label: 'Pair Basics', href: '#pair-basics' },
                                        { id: 'toc-pair-recursion', label: 'Pair Recursion', href: '#pair-recursion' },
                                        { id: 'toc-pair-inference', label: 'Pair Inference', href: '#pair-inference' },
                                ],
                        },
                        {
                                id: 'toc-topology',
                                label: 'Topology Atlas',
                                href: '#topology-atlas',
                                children: [
                                        { id: 'toc-three', label: 'Three Nodes', href: '#three-nodes' },
                                        { id: 'toc-four', label: 'Four Nodes', href: '#four-nodes' },
                                        { id: 'toc-five', label: 'Five Nodes', href: '#five-nodes' },
                                ],
                        },
                        {
                                id: 'toc-ext',
                                label: 'Extensions',
                                href: '#extensions',
                                children: [
                                        { id: 'toc-ext-stability', label: 'Extension Stability', href: '#extension-stability' },
                                        { id: 'toc-ext-density', label: 'Extension Density', href: '#extension-density' },
                                        { id: 'toc-ext-packing', label: 'Extension Packing', href: '#extension-packing' },
                                ],
                        },
                        {
                                id: 'toc-appendix',
                                label: 'Appendix',
                                href: '#appendix',
                                children: [
                                        { id: 'toc-design', label: 'Design Notes', href: '#design-notes' },
                                        { id: 'toc-contrib', label: 'Contributing', href: '#contributing' },
                                        { id: 'toc-license', label: 'License', href: '#license' },
                                ],
                        },
                ],
        },
]

const resolveNode = (nodes: Node[], path: string[]) => {
        let branch = nodes
        let current: Node | undefined
        for (const id of path) {
                current = branch.find((n) => n.id === id)
                branch = current?.children || []
        }
        return current
}
const pickChildren = (nodes: Node[], path: string[], depth: number) => resolveNode(nodes, path.slice(0, depth + 1))?.children || []
const frame = { position: 'relative', width: '100%', minHeight: '360px', padding: '24px', borderRadius: '16px', background: 'linear-gradient(120deg,#f7f8fb,#eef2f7)', boxShadow: '0 16px 48px rgba(15,23,42,0.12)', color: '#0f172a', overflow: 'hidden', fontFamily: '"SF Pro Display","Helvetica Neue",sans-serif' }
const bar = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'rgba(255,255,255,0.86)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 12px 32px rgba(15,23,42,0.14)' }
const overlay = { position: 'absolute' as const, inset: 0, background: 'rgba(15,23,42,0.18)', backdropFilter: 'blur(6px)' }
const panel = { position: 'absolute' as const, top: '68px', left: '12px', width: '240px', display: 'grid', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.94)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 18px 44px rgba(15,23,42,0.16)' }
const side = { ...panel, left: '268px', width: '250px' }
const card = { ...panel, left: '528px', width: '260px', padding: '16px', gap: '10px' }
const legendBox = { position: 'absolute' as const, bottom: '16px', right: '16px', width: '240px', padding: '12px', borderRadius: '12px', background: 'rgba(15,23,42,0.82)', color: '#e2e8f0', boxShadow: '0 10px 30px rgba(15,23,42,0.25)', display: 'grid', gap: '6px' }
const chip = { border: '0', padding: '9px 11px', textAlign: 'left' as const, borderRadius: '10px', background: '#f8fafc', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.08)', color: '#0f172a', fontWeight: 600, cursor: 'pointer' }
const badge = { marginLeft: 'auto', padding: '6px 10px', borderRadius: '10px', background: 'linear-gradient(135deg,#2563eb,#22d3ee)', color: '#f8fafc', fontWeight: 700, letterSpacing: '0.4px', textDecoration: 'none' }
const tile = { padding: '10px 12px', borderRadius: '10px', background: '#f1f5f9', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.06)', display: 'grid', alignItems: 'center', gap: '4px', cursor: 'pointer' }
const note = { fontSize: '12px', color: '#475569' }
const legendLine = { display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', lineHeight: 1.2 }
const dot = { width: '8px', height: '8px', borderRadius: '999px', background: '#22d3ee' }
const num = { marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: '#cbd5e1' }

const MenuPlayground = ({ ranks, labels }: { ranks: Layers; labels?: Legend }) => {
        const [path, setPath] = React.useState<string[]>([])
        const layer = (key: string) => ranks[key] ?? 0
        const openRoot = (id: string) => setPath([id])
        const close = (depth: number) => setPath((prev) => prev.slice(0, depth))
        const drill = (depth: number, node: Node) => {
                if (node.action) node.action()
                if (node.href) {
                        if (node.href.startsWith('#')) {
                                const target = document.querySelector(node.href)
                                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        } else window.open(node.href, '_blank', 'noreferrer')
                }
                if (node.children?.length)
                        setPath((prev) => {
                                const next = prev.slice(0, depth + 1)
                                next[depth + 1] = node.id
                                return next
                        })
        }
        const panelOne = path.length ? pickChildren(menuTree, path, 0) : []
        const panelTwo = path.length > 1 ? pickChildren(menuTree, path, 1) : []
        const detail = path.length > 2 ? resolveNode(menuTree, path) : undefined
        const legend = labels ? Object.entries(labels) : Object.entries(ranks).map(([k]) => [k, k])
        return (
                <div style={frame}>
                        <div style={{ ...bar, zIndex: layer('menu bar') }}>
                                {menuTree.map((item) => (
                                        <button key={item.id} style={chip} onClick={() => openRoot(item.id)}>
                                                {item.label}
                                        </button>
                                ))}
                                <a href="https://github.com/tseijp/z-idx" style={{ ...badge, zIndex: layer('badge') }} target="_blank" rel="noreferrer">
                                        GitHub
                                </a>
                        </div>
                        <div style={{ ...overlay, zIndex: layer('root overlay'), display: path.length ? 'block' : 'none' }} onClick={() => close(0)} />
                        <div style={{ ...panel, zIndex: layer('primary menu'), display: path.length ? 'grid' : 'none' }}>
                                {panelOne.map((item) => (
                                        <div key={item.id} style={tile} onClick={() => drill(0, item)}>
                                                <div>{item.label}</div>
                                                <div style={note}>{item.note}</div>
                                        </div>
                                ))}
                        </div>
                        <div style={{ ...overlay, zIndex: layer('secondary overlay'), display: path.length > 1 ? 'block' : 'none' }} onClick={() => close(1)} />
                        <div style={{ ...side, zIndex: layer('secondary menu'), display: path.length > 1 ? 'grid' : 'none' }}>
                                {panelTwo.map((item) => (
                                        <div key={item.id} style={tile} onClick={() => drill(1, item)}>
                                                <div>{item.label}</div>
                                                <div style={note}>{item.note}</div>
                                        </div>
                                ))}
                        </div>
                        <div style={{ ...overlay, zIndex: layer('detail overlay'), display: path.length > 2 ? 'block' : 'none' }} onClick={() => close(2)} />
                        <div style={{ ...card, zIndex: layer('detail card'), display: path.length > 2 ? 'grid' : 'none' }}>
                                <div style={{ fontWeight: 700 }}>{detail?.label}</div>
                                <div style={note}>{detail?.note || 'Open a link to jump out.'}</div>
                                {detail?.href ? (
                                        <a href={detail.href} style={{ color: '#2563eb', fontWeight: 700 }} target="_blank" rel="noreferrer">
                                                Open
                                        </a>
                                ) : null}
                        </div>
                        <div style={{ ...legendBox, zIndex: layer('legend box'), display: legend.length ? 'grid' : 'none' }}>
                                {legend.map(([key, text]) => (
                                        <div key={key} style={legendLine}>
                                                <span style={dot} />
                                                <span>{key}</span>
                                                <span>{text}</span>
                                                <span style={num}>{ranks[key]}</span>
                                        </div>
                                ))}
                        </div>
                </div>
        )
}

const CodeBlock = ({ code, language, inline }: CodeBlockProps) => (
        <LiveProvider code={code} language={language} theme={themes.vsLight}>
                <LiveEditor style={inline === '1' ? { display: 'inline-block', margin: '-10px -4px' } : undefined} />
        </LiveProvider>
)
const scope = { React, MenuPlayground, index, runtime }
const LiveBlock = ({ code, language }: CodeBlockProps) => (
        <LiveProvider code={code} language={language} theme={themes.vsLight} scope={scope} noInline>
                <div className="live-block">
                        <LiveEditor className="prism-code" />
                        <div className="live-output">
                                <LivePreview />
                                <LiveError />
                        </div>
                </div>
        </LiveProvider>
)
const Mermaid = ({ code, id }: { code: string; id: string }) => (
        <div
                className="mermaid-block"
                ref={
                        React.useRef((el: HTMLDivElement | null) => {
                                if (!el) return
                                mermaid.render(id, code).then(
                                        ({ svg }) => (el.innerHTML = svg),
                                        (error) => (el.innerHTML = `<pre class=\\\"mermaid-error\\\">${String(error)}</pre>`)
                                )
                        }).current
                }
        />
)

const md = markdownit({ html: true, linkify: true, typographer: true })
md.renderer.rules.code_inline = (tokens, idx) => `<code class="code-block" data-lang="ts" data-code="${encodeURIComponent(tokens[idx].content)}" data-inline="1"></code>`
md.renderer.rules.fence = (tokens, idx) => {
        const { info, content } = tokens[idx]
        if (info === 'mermaid') return `<div class="mermaid-block" data-code="${encodeURIComponent(content)}"></div>`
        return `<div class="code-block" data-lang="${info}" data-code="${encodeURIComponent(content)}"></div>`
}

const htmlEn = md.render(README)
const htmlJa = md.render(README_JA)
const slug = (s: string) =>
        s
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')

const App = () => {
        const [blocks, setBlocks] = React.useState<HTMLElement[]>([])
        const [charts, setCharts] = React.useState<HTMLElement[]>([])
        const ref = React.useRef<HTMLElement | null>(null)
        const renderDoc = (doc: string) => {
                if (!ref.current) return
                ref.current.innerHTML = doc
                const heads = Array.from(ref.current.querySelectorAll('h1,h2,h3,h4'))
                heads.forEach((h) => {
                        if (!h.id) h.id = slug(h.textContent || '')
                })
                setBlocks(Array.from(ref.current.querySelectorAll('.code-block')) as HTMLElement[])
                setCharts(Array.from(ref.current.querySelectorAll('.mermaid-block')) as HTMLElement[])
        }
        React.useEffect(() => {
                renderDoc(htmlEn)
                runtime.render = (lang) => renderDoc(lang === 'ja' ? htmlJa : htmlEn)
                return () => {
                        runtime.render = undefined
                }
        }, [])
        return (
                <>
                        <main ref={ref} />
                        {blocks.map((el, i) => {
                                const { code = '', lang = 'ts', inline = '0', id } = el.dataset
                                const Component = lang === 'tsx' && inline !== '1' ? LiveBlock : CodeBlock
                                return createPortal(<Component code={decodeURIComponent(code)} language={lang} inline={inline} />, el, id || `code-${i}`)
                        })}
                        {charts.map((el, i) => {
                                const { code = '', id } = el.dataset
                                return createPortal(<Mermaid code={decodeURIComponent(code)} id={id || `mermaid-${i}`} />, el, id || `mermaid-${i}`)
                        })}
                </>
        )
}

createRoot(document.getElementById('app')!).render(<App />)
