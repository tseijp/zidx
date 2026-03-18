type Pair = readonly [string, string]
type Edge<T extends readonly [unknown, ...unknown[]] = readonly [unknown, ...unknown[]]> = Pair[] & { [SYM]?: T }
type Node = string | Edge<any> | readonly Node[] | ((...a: any[]) => any)
type KeysOfTuple<T extends readonly unknown[]> = T extends readonly [infer H, ...infer Rest] ? NodeKeys<H> | KeysOfTuple<Rest> : never
type NodeKeys<T> = T extends string ? T : T extends Edge<infer U> ? KeysOfTuple<U> : T extends readonly (infer R)[] ? NodeKeys<R> : never
type Keys<P> = P extends Edge<infer U> ? KeysOfTuple<U> : P extends readonly unknown[] ? KeysOfTuple<P> : never
type BuildOut = Edge<any> | readonly unknown[]
type ZRes<K extends string> = { items: Record<K, number>; warns: string[] }
type ZExt<K extends string> = {
        <P extends readonly unknown[]>(build: (z: ZFun) => P): ZApi<K | Keys<P>>
        <T extends readonly [Node, Node, ...Node[]]>(build: (z: ZFun) => Edge<T>): ZApi<K | Keys<Edge<T>>>
}
type ZApi<K extends string> = ZExt<K> & Record<K, number> & { warns: string[] }
type ZFun = { <C extends readonly [Node, ...Node[]], A extends string>(lower: A, children: readonly [...C]): Edge<[A, ...C]>; <T extends readonly [Node, Node, ...Node[]]>(...keys: T): Edge<T> }
const SYM = Symbol('pack')
const INF = 1 << 30
const STEP = 1 << 10
const START = STEP
const GAP_WARN = STEP >> 4
const { max, min, floor } = Math
const clamp = (x: number, a: number, b: number) => min(max(x, a), b)
const edge = <T extends readonly [unknown, ...unknown[]]>(p: Pair[]) => (((p as any)[SYM] = true), p as Edge<T>)
const isEdge = (v: unknown): v is Edge => Array.isArray(v) && !!(v as any)[SYM]
const pack = (v: unknown): readonly unknown[] => (isEdge(v) ? [v] : Array.isArray(v) ? v : [v])
const sources = (ps: Pair[]) => {
        const d = new Map<string, number>()
        for (const [a, b] of ps) {
                if (!d.has(a)) d.set(a, 0)
                d.set(b, (d.get(b) || 0) + 1)
        }
        const r: string[] = []
        for (const [k, v] of d) if (v === 0) r.push(k)
        return r
}
const gather = (n: Node): { entries: string[]; pairs: Pair[] } => {
        if (typeof n === 'string') return { entries: [n], pairs: [] }
        if (typeof n === 'function') {
                const ks = Object.keys(n as any)
                        .filter((k) => k !== 'warns')
                        .sort((a, b) => ((n as any)[a] as number) - ((n as any)[b] as number))
                const p: Pair[] = []
                for (let i = 0; i < ks.length - 1; i += 1) p.push([ks[i], ks[i + 1]])
                return { entries: ks, pairs: p }
        }
        if (isEdge(n)) return { entries: sources(n as Pair[]), pairs: n as Pair[] }
        if (Array.isArray(n)) {
                const parts = (n as readonly Node[]).map((v) => {
                        const g = gather(v)
                        return { e: g.entries, p: g.pairs, n: typeof v !== 'string' }
                })
                const entries: string[] = []
                const pairs: Pair[] = []
                for (const p of parts) {
                        entries.push(...p.e)
                        pairs.push(...p.p)
                }
                for (let i = 0; i < parts.length - 1; i += 1) if (parts[i].n && parts[i + 1].n) for (const a of parts[i].e) for (const b of parts[i + 1].e) pairs.push([a, b])
                return { entries, pairs }
        }
        throw new Error('invalid node')
}
const z: ZFun = ((...args: readonly Node[]) => {
        const g = args.map(gather)
        const r: Pair[] = []
        for (const x of g) r.push(...x.pairs)
        for (let i = 0; i < g.length - 1; i += 1) for (const a of g[i].entries) for (const b of g[i + 1].entries) r.push([a, b])
        return edge(r)
}) as ZFun
const collect = (v: unknown, out: Pair[]): void => {
        if (isEdge(v)) {
                out.push(...(v as Pair[]))
                return
        }
        if (Array.isArray(v)) {
                for (const x of v) collect(x, out)
                return
        }
        throw new Error('invalid pair')
}
const topo = (pairs: Pair[], extras: string[]) => {
        const succ = new Map<string, string[]>()
        const indeg = new Map<string, number>()
        const preds = new Map<string, string[]>()
        const add = (k: string) => {
                if (!succ.has(k)) succ.set(k, [])
                if (!indeg.has(k)) indeg.set(k, 0)
                if (!preds.has(k)) preds.set(k, [])
        }
        for (const [a, b] of pairs) {
                add(a)
                add(b)
                succ.get(a)!.push(b)
                indeg.set(b, (indeg.get(b) || 0) + 1)
                preds.get(b)!.push(a)
        }
        for (const k of extras) add(k)
        const q: string[] = []
        for (const [k, v] of indeg) if (v === 0) q.push(k)
        const order: string[] = []
        for (let i = 0; i < q.length; i += 1) {
                const n = q[i]
                order.push(n)
                for (const v of succ.get(n) || []) {
                        const d = (indeg.get(v) || 0) - 1
                        indeg.set(v, d)
                        if (d === 0) q.push(v)
                }
        }
        if (order.length !== indeg.size) throw new Error('cycle')
        return { order, preds, succ }
}
const assign = <K extends string>(pairs: Pair[], seeds: Record<string, number> = {}): ZRes<K> => {
        const { order, preds, succ } = topo(pairs, Object.keys(seeds))
        const lo: Record<string, number> = {}
        const hi: Record<string, number> = {}
        const depth: Record<string, number> = {}
        const width: Record<number, number> = {}
        const cursor: Record<number, number> = {}
        for (const n of order) depth[n] = 0
        for (const n of order) for (const v of succ.get(n) || []) depth[v] = max(depth[v] || 0, (depth[n] || 0) + 1)
        for (const n of order) width[depth[n]] = (width[depth[n]] || 0) + 1
        for (const n of order) {
                if (n in seeds) {
                        lo[n] = seeds[n]
                        hi[n] = seeds[n]
                        continue
                }
                lo[n] = -INF
                hi[n] = INF
        }
        for (const n of order) {
                let base = lo[n]
                if (n in seeds) base = seeds[n]
                if (base !== -INF) for (const v of succ.get(n) || []) if (!(v in seeds)) lo[v] = max(lo[v], base + 1)
        }
        for (let i = order.length - 1; i >= 0; i -= 1) {
                const n = order[i]
                let base = hi[n]
                if (n in seeds) base = seeds[n]
                if (base !== INF) for (const p of preds.get(n) || []) if (!(p in seeds)) hi[p] = min(hi[p], base - 1)
        }
        const warns: string[] = []
        const items = { ...seeds } as Record<K, number>
        for (const n of order) {
                if (n in seeds) continue
                const l = lo[n]
                const h = hi[n]
                const hasL = l !== -INF
                const hasH = h !== INF
                let v: number
                if (!hasL && !hasH) {
                        const d = depth[n] || 0
                        let spread = 0
                        if (width[d] > 4) spread = max(1, floor(STEP / (width[d] + 1)))
                        const idx = (cursor[d] = (cursor[d] || 0) + 1)
                        v = START + d * STEP + spread * idx
                } else if (!hasH) {
                        const hasPred = (preds.get(n) || []).length > 0
                        if (hasPred) v = l - 1 + STEP
                        else if (hasL) v = l
                        else v = START - STEP
                } else if (!hasL) v = max(1, (h + 1) >> 1)
                else {
                        const gap = h - l
                        if (gap <= GAP_WARN) warns.push(`narrow gap ${n}`)
                        v = l + max(1, gap >> 1)
                }
                let low = -INF
                if (hasL) low = l + 1
                let high = INF
                if (hasH) high = h - 1
                items[n as K] = clamp(v, low, high)
        }
        return { items: items as Record<K, number>, warns }
}
const api = <K extends string>({ items, warns }: ZRes<K>): ZApi<K> => {
        const impl = (build: (z: ZFun) => BuildOut) => {
                const pairs: Pair[] = []
                for (const v of pack(build(z))) collect(v, pairs)
                const next = assign(pairs, items as Record<string, number>)
                return api<any>({ items: next.items as Record<any, number>, warns: [...warns, ...next.warns] })
        }
        const ext = impl as ZExt<K>
        return Object.assign(ext, { ...items, warns })
}
export function index<P extends readonly unknown[]>(build: (z: ZFun) => P): ZApi<Keys<P>>
export function index<T extends readonly [Node, Node, ...Node[]]>(build: (z: ZFun) => Edge<T>): ZApi<Keys<Edge<T>>>
export function index(build: (z: ZFun) => BuildOut) {
        const pairs: Pair[] = []
        for (const v of pack(build(z))) collect(v, pairs)
        return api(assign(pairs))
}
export default index
