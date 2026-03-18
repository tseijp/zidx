type Pair = readonly [string, string]
const ZTag = Symbol('z')
type TaggedPairs<T extends readonly [unknown, ...unknown[]] = readonly [unknown, ...unknown[]]> = Pair[] & { [ZTag]?: T }
type Node = string | TaggedPairs<any> | readonly Node[] | ((...a: any[]) => any)
type KeysOf<T> = T extends string ? T : T extends TaggedPairs<infer U> ? KeysOf<U> : T extends readonly (infer R)[] ? KeysOf<R> : never
type Keys<P> = P extends TaggedPairs<infer U> ? KeysOf<U> : P extends readonly (infer R)[] ? Keys<R> : never
type ZRes<K extends string> = { items: Record<K, number>; warns: string[] }
type ZExt<K extends string> = <P extends readonly unknown[]>(build: (z: ZPair) => P) => ZApi<K | Keys<P>>
type ZApi<K extends string> = ZExt<K> & Record<K, number> & { warns: string[] }
type ZPair = { <C extends readonly [Node, ...Node[]], A extends string>(lower: A, children: readonly [...C]): TaggedPairs<[A, ...C]>; <T extends readonly [Node, Node, ...Node[]]>(...keys: T): TaggedPairs<T> }
const INF = 1 << 30
const STEP = 1 << 10
const START = STEP
const GAP_WARN = STEP >> 4
const { max, min, floor } = Math
type EP = { entries: string[]; pairs: Pair[] }
const mark = <T extends readonly [unknown, ...unknown[]]>(p: Pair[]) => (((p as any)[ZTag] = true), p as TaggedPairs<T>)
const isTagged = (v: unknown): v is TaggedPairs => Array.isArray(v) && !!(v as any)[ZTag]
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
const gather = (n: Node): EP => {
        if (typeof n === 'string') return { entries: [n], pairs: [] }
        if (typeof n === 'function') {
                const ks = Object.keys(n)
                        .filter((k) => k !== 'warns')
                        .sort((a, b) => ((n as any)[a] as number) - ((n as any)[b] as number))
                const p: Pair[] = []
                for (let i = 0; i < ks.length - 1; i += 1) p.push([ks[i], ks[i + 1]])
                return { entries: ks, pairs: p }
        }
        if (isTagged(n)) return { entries: sources(n as Pair[]), pairs: n as Pair[] }
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
const pair: ZPair = ((...args: readonly Node[]) => {
        const g = args.map(gather)
        const r: Pair[] = []
        for (const x of g) r.push(...x.pairs)
        for (let i = 0; i < g.length - 1; i += 1) for (const a of g[i].entries) for (const b of g[i + 1].entries) r.push([a, b])
        return mark(r)
}) as ZPair
const collect = (v: unknown, out: Pair[]): void => {
        if (isTagged(v)) {
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
                if (hasH && v >= h) v = h - 1
                if (hasL && v <= l) v = l + 1
                items[n as K] = v
        }
        return { items: items as Record<K, number>, warns }
}
const api = <K extends string>({ items, warns }: ZRes<K>): ZApi<K> => {
        const ext = <P extends readonly unknown[]>(build: (z: ZPair) => P) => {
                const pairs: Pair[] = []
                for (const v of build(pair)) collect(v, pairs)
                const next = assign<K | Keys<P>>(pairs, items as Record<K | Keys<P>, number>)
                return api<K | Keys<P>>({ items: next.items, warns: [...warns, ...next.warns] })
        }
        return Object.assign(ext, { ...items, warns })
}
export function index<P extends readonly unknown[]>(build: (z: ZPair) => P): ZApi<Keys<P>> {
        const pairs: Pair[] = []
        for (const v of build(pair)) collect(v, pairs)
        return api<Keys<P>>(assign<Keys<P>>(pairs))
}
export default index
