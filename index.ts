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
        <const Req extends ZReq>(build: (z: ZFun) => Req, config?: Config): ZApi<K | Keys<Req>>
}
export type Data = { key: string; children: Data[]; parents: Data[]; indeg: number; lo: number; hi: number; up: number; depth: number }
export type Config = { seeds?: ZRes; inf?: number; step?: number; start?: number; mode?: 'dyadic' | 'floor'; divide?: (n: number) => number }
const SYM = Symbol('z')
const { max, min } = Math
const divisor = (mode: Config['mode']): Config['divide'] => {
        if (mode === 'floor') return (n) => max(1, Math.floor(n))
        return (n) => {
                if (n <= 1) return 1
                return 1 << (31 - Math.clz32(n))
        }
}
function* backward<T>(arr: T[]) {
        for (let i = arr.length - 1; i >= 0; i--) yield arr[i]
}
const isEdge = (v: unknown): v is Edge => Array.isArray(v) && SYM in v
const gather = (n: Node): { entries: string[]; edge: readonly Pair[] } => {
        if (typeof n === 'string') return { entries: [n], edge: [] }
        if (typeof n === 'function') {
                // @ts-ignore
                const entries = Object.keys(n).sort((a, b) => n[a] - n[b])
                const edge: Pair[] = []
                for (let i = 0; i < entries.length - 1; i++) edge.push([entries[i], entries[i + 1]])
                return { entries, edge }
        }
        if (isEdge(n)) {
                const map = new Map<string, number>()
                for (const [a, b] of n) {
                        if (!map.has(a)) map.set(a, 0)
                        map.set(b, (map.get(b) || 0) + 1)
                }
                const entries: string[] = []
                for (const [k, v] of map) if (v === 0) entries.push(k)
                return { entries, edge: n }
        }
        if (Array.isArray(n)) {
                const parts = n.map((v) => {
                        const g = gather(v)
                        return { e: g.entries, p: g.edge, n: typeof v !== 'string' }
                })
                const entries: string[] = []
                const edge: Pair[] = []
                for (const p of parts) {
                        entries.push(...p.e)
                        edge.push(...p.p)
                }
                for (let i = 0; i < parts.length - 1; i++) if (parts[i].n && parts[i + 1].n) for (const a of parts[i].e) for (const b of parts[i + 1].e) edge.push([a, b])
                return { entries, edge }
        }
        throw new Error(`invalid node: ${n}`)
}
const collect = (v: unknown, out: Pair[]): void => {
        if (isEdge(v)) {
                out.push(...v)
                return
        }
        if (Array.isArray(v)) {
                for (const x of v) collect(x, out)
                return
        }
        throw new Error('invalid pair: ${v}')
}

const graph = (edge: Pair[], inf: number, seeds?: ZRes): Map<string, Data> => {
        const nodes = new Map<string, Data>()
        const get = (key: string): Data => {
                let node = nodes.get(key) // parent predecessors(z=0) -> node(z=1) -> children successors(z=2)
                if (!node) nodes.set(key, (node = { key, parents: [], children: [], indeg: 0, lo: -inf, hi: inf, up: 0, depth: 0 }))
                return node
        }
        for (const [a, b] of edge) {
                const _a = get(a)
                const _b = get(b)
                _b.parents.push(_a)
                _a.children.push(_b)
                _b.indeg++
        }
        if (seeds) for (const key in seeds) get(key)
        return nodes
}
const topo = (nodes: Map<string, Data>): Data[] => {
        const queue: Data[] = []
        for (const [, node] of nodes) if (node.indeg === 0) queue.push(node)
        for (const { children } of queue) for (const child of children) if (--child.indeg === 0) queue.push(child)
        if (queue.length !== nodes.size) throw new Error(`cycle: ${[...nodes.values()].find((n) => n.indeg > 0)!.key}`)
        return queue
}
const depth = (queue: Data[]) => {
        for (const node of queue) {
                const next = node.depth + 1
                for (const child of node.children) child.depth = max(child.depth, next)
        }
}

const assign = (edge: Pair[], { seeds, inf = 1073741824, mode, step = 1024, start = step, divide = divisor(mode)! }: Config = {}): ZRes => {
        const nodes = graph(edge, inf, seeds)
        const queue = topo(nodes)
        depth(queue)
        const res: ZRes = seeds ? { ...seeds } : {}
        if (!seeds) {
                for (const node of queue) res[node.key] = start + node.depth * step
                return res
        }
        for (const node of queue) {
                if (node.key in res) node.lo = node.hi = res[node.key]
                else for (const parent of node.parents) node.lo = max(node.lo, parent.lo)
        }
        for (const node of backward(queue)) {
                if (node.key in res) continue
                for (const child of node.children) {
                        node.hi = min(node.hi, child.hi)
                        node.up = max(node.up, child.up + 1)
                }
        }
        for (const node of queue) {
                if (node.key in res) continue
                const LO = node.lo !== -inf
                const HI = node.hi !== inf
                if (LO && HI) {
                        const span = node.depth + node.up
                        const diff = divide((node.hi - node.lo) / span)
                        if (diff <= 0) throw new Error(`cannot insert node ${node.key}: no room between bounds (${node.lo} .. ${node.hi},)`)
                        res[node.key] = node.lo + diff * node.depth
                } else if (HI) {
                        const span = node.depth + node.up + 1
                        const diff = divide(node.hi / span)
                        res[node.key] = node.hi - diff * node.up
                } else if (LO) {
                        res[node.key] = node.lo + step * node.depth
                } else throw new Error(`unreachable unbounded node: ${node.key}`)
        }
        return res
}
const z = (...args: Node[]): Edge => {
        const g = args.map(gather)
        const edge: Pair[] = []
        for (const x of g) edge.push(...x.edge)
        for (let i = 0; i < g.length - 1; i++) for (const a of g[i].entries) for (const b of g[i + 1].entries) edge.push([a, b]) // @ts-ignore
        edge[SYM] = true
        return edge
}
const api = (res?: ZRes, config?: Config): ZApi => {
        const ret = (build: (z: ZFun) => unknown, _config?: Config) => {
                _config = Object.assign({}, config, { seeds: res }, _config)
                return index(build, _config)
        }
        if (res) Object.assign(ret, res)
        return ret as ZApi
}
export function index<const Req extends ZReq>(build: (z: ZFun) => Req, config?: Config): ZApi<Keys<Req>> {
        const edge: Pair[] = []
        collect(build(z), edge)
        return api(assign(edge, config), config)
}
export default index
