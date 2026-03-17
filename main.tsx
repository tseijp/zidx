import './main.css'
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
type NodeProps = { id: string; label: string; href?: string; note?: string; action?: () => void; children?: React.ReactNode }
type NodeTree = Omit<NodeProps, 'children'> & { children?: NodeTree[] }
const toTree = (input: React.ReactNode): NodeTree[] => {
        const items: NodeTree[] = []
        for (const child of React.Children.toArray(input)) {
                if (!React.isValidElement(child)) continue
                if (child.type === React.Fragment) {
                        // @ts-ignore
                        items.push(...toTree(child.props.children))
                        continue
                }
                const props = child.props as NodeProps
                const node: NodeTree = { id: props.id, label: props.label, href: props.href, note: props.note, action: props.action }
                const kids = props.children ? toTree(props.children) : []
                if (kids.length) node.children = kids
                items.push(node)
        }
        return items
}
const runtime: { render?: (lang: 'en' | 'ja') => void } = {}
const NavNode = (_: NodeProps) => null
const menuTree = toTree(
        <>
                <NavNode id="docs" label="Docs">
                        <NavNode id="lang-en" label="English" note="README.md" action={() => runtime.render?.('en')} />
                        <NavNode id="lang-ja" label="日本語" note="README.ja.md" action={() => runtime.render?.('ja')} />
                </NavNode>
                <NavNode id="links" label="Links">
                        <NavNode id="github" label="GitHub" note="Source">
                                <NavNode id="github-code" label="Code" href="https://github.com/tseijp/z-idx"></NavNode>
                                <NavNode id="github-issues" label="Issues" href="https://github.com/tseijp/z-idx/issues"></NavNode>
                                <NavNode id="github-pulls" label="Pull Requests" href="https://github.com/tseijp/z-idx/pulls"></NavNode>
                        </NavNode>
                        <NavNode id="npm" label="npm" note="Package">
                                <NavNode id="npm-readme" label="Readme" href="https://www.npmjs.com/package/z-idx" />
                                <NavNode id="npm-dependencies" label="0 Dependencies" href="https://www.npmjs.com/package/z-idx?activeTab=dependencies" />
                                <NavNode id="npm-versions" label="1 Versions" href="https://www.npmjs.com/package/z-idx?activeTab=versions" />
                        </NavNode>
                        <NavNode id="tseijp" label="@tseijp" note="Author">
                                <NavNode id="tseijp-github" label="Github" note="@tseijp" href="https://github.com/tseijp"></NavNode>
                                <NavNode id="tseijp-twitter" label="Twitter" note="@tseijp" href="https://twitter.com/tseijp"></NavNode>
                                <NavNode id="tseijp-twitter" label="Website" note="tsei.jp" href="https://tsei.jp"></NavNode>
                        </NavNode>
                </NavNode>
                <NavNode id="cases" label="Suites">
                        <NavNode id="pair" label="Pair Catalogue" note="0.*.pair-*.test.ts">
                                <NavNode id="pair-basics" label="pair-basics" note="0.0.pair-basics.test.ts" href="https://github.com/tseijp/z-idx/blob/main/0.0.pair-basics.test.ts" />
                                <NavNode id="pair-recursion" label="pair-recursion" note="0.1.pair-recursion.test.ts" href="https://github.com/tseijp/z-idx/blob/main/0.1.pair-recursion.test.ts" />
                                <NavNode id="pair-inference" label="pair-inference" note="0.2.pair-inference.test.ts" href="https://github.com/tseijp/z-idx/blob/main/0.2.pair-inference.test.ts" />
                        </NavNode>
                        <NavNode id="topo" label="Topology Atlas" note="1.*.topo-*-nodes.test.ts">
                                <NavNode id="topo-three" label="topo-three-nodes" note="1.0.topo-three-nodes.test.ts" href="https://github.com/tseijp/z-idx/blob/main/1.0.topo-three-nodes.test.ts" />
                                <NavNode id="topo-four" label="topo-four-nodes" note="1.1.topo-four-nodes.test.ts" href="https://github.com/tseijp/z-idx/blob/main/1.1.topo-four-nodes.test.ts" />
                                <NavNode id="topo-five" label="topo-five-nodes" note="1.2.topo-five-nodes.test.ts" href="https://github.com/tseijp/z-idx/blob/main/1.2.topo-five-nodes.test.ts" />
                        </NavNode>
                        <NavNode id="ext" label="Extensions" note="2.*.extension-*.test.ts">
                                <NavNode id="ext-stability" label="extension-stability" note="2.0.extension-stability.test.ts" href="https://github.com/tseijp/z-idx/blob/main/2.0.extension-stability.test.ts" />
                                <NavNode id="ext-density" label="extension-density" note="2.1.extension-density.test.ts" href="https://github.com/tseijp/z-idx/blob/main/2.1.extension-density.test.ts" />
                                <NavNode id="ext-packing" label="extension-packing" note="2.2.extension-packing.test.ts" href="https://github.com/tseijp/z-idx/blob/main/2.2.extension-packing.test.ts" />
                        </NavNode>
                </NavNode>
                <NavNode id="toc" label="TOC">
                        <NavNode id="toc-rationale" label="2. Rationale">
                                <NavNode id="toc-core" label="2.1. Core Concepts" href="#core-concepts" />
                                <NavNode id="toc-type" label="2.2. Type Inference" href="#type-inference" />
                                <NavNode id="toc-api" label="2.3. API Surface" href="#api-surface" />
                        </NavNode>
                        <NavNode id="toc-pairs" label="3. Pair Catalogue">
                                <NavNode id="toc-pair-basics" label="3.1. Pair Basics" href="#pair-basics" />
                                <NavNode id="toc-pair-recursion" label="3.2. Pair Recursion" href="#pair-recursion" />
                                <NavNode id="toc-pair-inference" label="3.3. Pair Inference" href="#pair-inference" />
                        </NavNode>
                        <NavNode id="toc-topology" label="4. Topology Atlas">
                                <NavNode id="toc-three" label="4.1. Three Nodes" href="#three-nodes" />
                                <NavNode id="toc-four" label="4.2. Four Nodes" href="#four-nodes" />
                                <NavNode id="toc-five" label="4.3. Five Nodes" href="#five-nodes" />
                        </NavNode>
                        <NavNode id="toc-ext" label="5.1 Extensions">
                                <NavNode id="toc-ext-stability" label="5.1. Extension Stability" href="#extension-stability" />
                                <NavNode id="toc-ext-density" label="5.2. Extension Density" href="#extension-density" />
                                <NavNode id="toc-ext-packing" label="5.3. Extension Packing" href="#extension-packing" />
                        </NavNode>
                        <NavNode id="toc-appendix" label="6. Appendix">
                                <NavNode id="toc-design" label="6.1. Design Notes" href="#design-notes" />
                                <NavNode id="toc-contrib" label="6.2. Contributing" href="#contributing" />
                                <NavNode id="toc-license" label="6.3. License" href="#license" />
                        </NavNode>
                </NavNode>
        </>
)
const Overlay = ({ show, z, close }: { show: boolean; z: number; close: () => void }) => <div className="absolute inset-0 bg-overlay glass" style={{ zIndex: z, display: show ? 'block' : 'none' }} onClick={close} />
const PanelSlot = ({ show, z, left, children }: { show: boolean; z: number; left: string; children: React.ReactNode }) => (
        <div className={`absolute p-x w top-68 ${left} grid gap-y bg-white-strong rounded-2x shadow-xl`} style={{ zIndex: z, display: show ? 'grid' : 'none' }}>
                {children}
        </div>
)
const PanelList = ({ items, drill }: { items: NodeTree[]; drill: (node: NodeTree) => void }) => (
        <>
                {items.map((item) => (
                        <div key={item.id} className="grid p-yx items-center bg-tile rounded-x shadow-inset-soft cursor" onClick={() => drill(item)}>
                                <div>{item.label}</div>
                                <div className="font-x text-muted">{item.note}</div>
                        </div>
                ))}
        </>
)
const MenuPlayground = ({ next }: { next: Record<string, number> }) => {
        const [path, setPath] = React.useState<string[]>([])
        const openRoot = (id: string) => setPath([id])
        const close = (depth: number) => setPath((prev) => prev.slice(0, depth))
        const drill = (depth: number, node: NodeTree) => {
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
        const resolveNode = (nodes: NodeTree[], path: string[]) => {
                let branch = nodes
                let current: NodeTree | undefined
                for (const id of path) {
                        current = branch.find((n) => n.id === id)
                        branch = current?.children || []
                }
                return current
        }
        const pickChildren = (nodes: NodeTree[], path: string[], depth: number) => resolveNode(nodes, path.slice(0, depth + 1))?.children || []
        const panelOne = path.length ? pickChildren(menuTree, path, 0) : []
        const panelTwo = path.length > 1 ? pickChildren(menuTree, path, 1) : []
        return (
                <div className="relative my-x p-x w-full h bg-grad rounded-3x shadow-lg text-ink overflow-hidden font-sf">
                        <div className="flex p-x gap-x items-center wrap bg-white rounded-2x shadow-md" style={{ zIndex: next['menu bar'] }}>
                                {menuTree.map((item) => (
                                        <button key={item.id} className="p-yx bg-chip rounded-x shadow-inset text-ink font-bold cursor" onClick={() => openRoot(item.id)}>
                                                {item.label}
                                        </button>
                                ))}
                                <a href="https://github.com/tseijp/z-idx" className="ml-auto mr-x text-onyx font-bold tracking" style={{ zIndex: next['Github'] }} target="_blank" rel="noreferrer">
                                        GitHub
                                </a>
                        </div>
                        <Overlay show={!!path.length} z={next['primary overlay']} close={() => close(0)} />
                        <PanelSlot show={!!path.length} z={next['primary menu']} left="left-x">
                                <PanelList items={panelOne} drill={(item) => drill(0, item)} />
                        </PanelSlot>
                        <Overlay show={path.length > 1} z={next['secondary overlay']} close={() => close(1)} />
                        <PanelSlot show={path.length > 1} z={next['secondary menu']} left="left-2x">
                                <PanelList items={panelTwo} drill={(item) => drill(1, item)} />
                        </PanelSlot>
                </div>
        )
}
type CodeBlockProps = { code: string; language: string; inline?: string }
const CodeBlock = ({ code, language, inline }: CodeBlockProps) => (
        <LiveProvider code={code?.trim()} language={language} theme={themes.vsLight}>
                <LiveEditor style={inline === '1' ? { display: 'inline-block' } : undefined} />
        </LiveProvider>
)
const scope = { React, MenuPlayground, index, runtime }
const LiveBlock = ({ code, language }: CodeBlockProps) => (
        <LiveProvider code={code?.trim()} language={language} theme={themes.vsLight} scope={scope} noInline>
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

// @ts-ignore
window.index = index
