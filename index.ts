type Pair = [string, string]
type Edge<T extends readonly unknown[] = readonly unknown[]> = readonly Pair[] & { [SYM]?: T }
type Node = string | Function | Edge | readonly Node[]
// prettier-ignore
type _Keys<T> =
        T extends string ? T :
        T extends Edge<infer T> ? _Keys<T> :
        T extends readonly (infer T)[] ? _Keys<T> :
        T extends Function ? Exclude<keyof T, keyof Function> :
        never
// prettier-ignore
type Keys<Req> =
        Req extends Edge<infer T> ? _Keys<T> :
        Req extends readonly (infer Req)[] ? Keys<Req> :
        never
export type ZReq = unknown | unknown[] // Edge | Edge[] @TODO FIX: Instantiations: 29243 → 64816
export type ZRes<K extends string = string> = Record<K, number>
export type ZApi<K extends string = string> = ZExt<K> & ZRes<K>
export type ZFun = {
        <const T extends readonly string[]>(...args: T): Edge<T> // @MEMO Instantiations: 29637 →　29243
        <const T extends readonly Node[]>(...args: T): Edge<T>
}
export type ZExt<K extends string = string> = {
        <const Req extends ZReq>(build: (z: ZFun) => Req): ZApi<K | Keys<Req>>
}
type Data = { key: string; children: Data[]; parents: Data[]; indeg: number; lo: number; hi: number; depth: number }
type Meta = { width: number; spread: number; cursor: number }
const SYM = Symbol('z')
const INF = 1 << 30
const STEP = 1 << 10
const START = STEP
const { max, min, floor } = Math
const isEdge = (v: unknown): v is Edge => Array.isArray(v) && SYM in v
const isPair = (v: unknown): v is Pair => Array.isArray(v)
const gather = (n: Node): { entries: string[]; pairs: readonly Pair[] } => {
        if (typeof n === 'string') return { entries: [n], pairs: [] }
        if (typeof n === 'function') {
                // @ts-ignore
                const entries = Object.keys(n).sort((a, b) => n[a] - n[b])
                const pairs: Pair[] = []
                for (let i = 0; i < entries.length - 1; i++) pairs.push([entries[i], entries[i + 1]])
                return { entries, pairs }
        }
        if (isEdge(n)) {
                const d = new Map<string, number>()
                for (const [a, b] of n) {
                        if (!d.has(a)) d.set(a, 0)
                        d.set(b, (d.get(b) || 0) + 1)
                }
                const entries: string[] = []
                for (const [k, v] of d) if (v === 0) entries.push(k)
                return { entries, pairs: n }
        }
        if (isPair(n)) {
                const parts = n.map((v) => {
                        const g = gather(v)
                        return { e: g.entries, p: g.pairs, n: typeof v !== 'string' }
                })
                const entries: string[] = []
                const pairs: Pair[] = []
                for (const p of parts) {
                        entries.push(...p.e)
                        pairs.push(...p.p)
                }
                for (let i = 0; i < parts.length - 1; i++) if (parts[i].n && parts[i + 1].n) for (const a of parts[i].e) for (const b of parts[i + 1].e) pairs.push([a, b])
                return { entries, pairs }
        }
        throw new Error('invalid node')
}
const z = (...args: Node[]): Edge => {
        const g = args.map(gather)
        const r: Pair[] = []
        for (const x of g) r.push(...x.pairs)
        for (let i = 0; i < g.length - 1; i++) for (const a of g[i].entries) for (const b of g[i + 1].entries) r.push([a, b]) // @ts-ignore
        r[SYM] = true
        return r
}
const collect = (v: unknown, out: Pair[]): void => {
        if (isEdge(v)) {
                out.push(...v)
                return
        }
        if (isPair(v)) {
                for (const x of v) collect(x, out)
                return
        }
        throw new Error('invalid pair')
}
const graph = (pairs: Pair[], extras: string[]): Map<string, Data> => {
        const nodes = new Map<string, Data>()
        const get = (key: string): Data => {
                let node = nodes.get(key) // parent predecessors(z=0) -> node(z=1) -> children successors(z=2)
                if (!node) nodes.set(key, (node = { key, parents: [], children: [], indeg: 0, lo: -INF, hi: INF, depth: 0 }))
                return node
        }
        for (const [a, b] of pairs) {
                const _a = get(a)
                const _b = get(b)
                _b.parents.push(_a)
                _a.children.push(_b)
                _b.indeg++
        }
        for (const key of extras) get(key)
        return nodes
}
const topo = (nodes: Map<string, Data>): Data[] => {
        const queue: Data[] = []
        for (const [, node] of nodes) if (node.indeg === 0) queue.push(node)
        for (const { children } of queue) for (const child of children) if (--child.indeg === 0) queue.push(child)
        if (queue.length !== nodes.size) throw new Error('cycle')
        return queue
}
function* backward<T>(arr: T[]) {
        for (let i = arr.length - 1; i >= 0; i--) yield arr[i]
}
const assign = (pairs: Pair[], seeds: ZRes = {}): ZRes => {
        const nodes = graph(pairs, Object.keys(seeds))
        const queue = topo(nodes)
        for (const node of queue) {
                if (node.key in seeds) node.lo = node.hi = seeds[node.key]
                const next = node.depth + 1
                for (const child of node.children) child.depth = max(child.depth, next)
        }
        const meta: Meta[] = []
        for (const [, node] of nodes) {
                const d = node.depth
                if (!meta[d]) meta[d] = { width: 0, spread: 0, cursor: 0 }
                meta[d].width++
        }
        for (const m of meta) m.spread = m.width > 4 ? max(1, floor(STEP / (m.width + 1))) : 0
        for (const node of queue) {
                if (node.lo === -INF) continue
                const next = node.lo + 1
                for (const child of node.children) {
                        if (child.key in seeds) continue
                        child.lo = max(child.lo, next)
                }
        }
        for (const node of backward(queue)) {
                if (node.hi === INF) continue
                const next = node.hi - 1
                for (const parent of node.parents) {
                        if (parent.key in seeds) continue
                        parent.hi = min(parent.hi, next)
                }
        }
        const fence = ({ lo, hi, depth, parents }: Data): number => {
                if (lo !== -INF && hi !== INF) return lo + max(1, (hi - lo) >> 1)
                if (lo !== -INF) return parents.length ? lo - 1 + STEP : lo
                if (hi !== INF) return max(1, (hi + 1) >> 1)
                const m = meta[depth]
                return START + depth * STEP + m.spread * ++m.cursor
        }
        const res: ZRes = { ...seeds }
        for (const node of queue) {
                if (node.key in seeds) continue
                res[node.key] = fence(node)
        }
        return res
}
const api = (items: ZRes): ZApi => {
        const ext: ZExt = (build) => {
                const pairs: Pair[] = []
                collect(build(z), pairs)
                const next = assign(pairs, items)
                return api(next)
        }
        return Object.assign(ext, items)
}
export function index<const Req extends ZReq>(build: (z: ZFun) => Req): ZApi<Keys<Req>> {
        const pairs: Pair[] = []
        collect(build(z), pairs)
        return api(assign(pairs))
}
export default index
