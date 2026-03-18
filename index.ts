type Pair = readonly [string, string]
declare const ZTag: unique symbol
type TaggedPairs<T extends readonly [unknown, ...unknown[]]> = Pair[] & { [ZTag]?: T }
type Node = string | TaggedPairs<any> | readonly Node[]
type KeysOf<T> = T extends string ? T : T extends TaggedPairs<infer U> ? KeysOf<U> : T extends readonly (infer R)[] ? KeysOf<R> : never
type Keys<P> = P extends TaggedPairs<infer U> ? KeysOf<U> : P extends readonly (infer R)[] ? Keys<R> : never
type ZRes<K extends string> = { items: Record<K, number>; warns: string[] }
type ZExt<K extends string> = <P extends readonly unknown[]>(build: (z: ZPair) => P) => ZApi<K | Keys<P>>
type ZApi<K extends string> = ZExt<K> & Record<K, number> & { warns: string[] }
type ZPair = { <C extends readonly [Node, ...Node[]], A extends string>(lower: A, children: readonly [...C]): TaggedPairs<[A, ...C]>; <T extends readonly [Node, Node, ...Node[]]>(...keys: T): TaggedPairs<T> }
const STEP = 1 << 10
const START = STEP
const FAN_FLAT_LIMIT = 4
const GAP_WARN = STEP >> 4
const isPair = (v: unknown): v is Pair => Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string'
const isPairs = (v: unknown): v is Pair[] => Array.isArray(v) && Array.isArray((v as any)[0]) && isPair((v as any)[0])
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
        if (Array.isArray(n)) {
                if (isPairs(n)) return { entries: sources(n), pairs: n }
                const e: string[] = []
                const p: Pair[] = []
                for (const v of n as readonly Node[]) {
                        const g = gather(v)
                        e.push(...g.entries)
                        p.push(...g.pairs)
                }
                return { entries: e, pairs: p }
        }
        throw new Error('invalid node')
}
const pair: ZPair = ((...args: readonly Node[]) => {
        const g = args.map(gather)
        const r: Pair[] = []
        for (const x of g) r.push(...x.pairs)
        for (let i = 0; i < g.length - 1; i += 1) for (const a of g[i].entries) for (const b of g[i + 1].entries) r.push([a, b])
        return r as TaggedPairs<any>
}) as ZPair
const collect = (v: unknown, out: Pair[]): void => {
        if (isPairs(v)) {
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
        const adj = new Map<string, string[]>()
        const indeg = new Map<string, number>()
        const preds = new Map<string, string[]>()
        const add = (k: string) => {
                if (!adj.has(k)) adj.set(k, [])
                if (!indeg.has(k)) indeg.set(k, 0)
                if (!preds.has(k)) preds.set(k, [])
        }
        for (const [a, b] of pairs) {
                add(a)
                add(b)
                adj.get(a)!.push(b)
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
                for (const v of adj.get(n) || []) {
                        const d = (indeg.get(v) || 0) - 1
                        indeg.set(v, d)
                        if (d === 0) q.push(v)
                }
        }
        if (order.length !== indeg.size) throw new Error('cycle')
        return { order, preds, succ: adj }
}
const assign = <K extends string>(pairs: Pair[], seeds: Record<string, number> = {}): ZRes<K> => {
        const { order, preds, succ } = topo(pairs, Object.keys(seeds))
        const lo: Record<string, number> = {}
        const hi: Record<string, number> = {}
        const depth: Record<string, number> = {}
        const width: Record<number, number> = {}
        const cursor: Record<number, number> = {}
        for (const n of order) depth[n] = 0
        for (const n of order) for (const v of succ.get(n) || []) depth[v] = Math.max(depth[v] || 0, (depth[n] || 0) + 1)
        for (const n of order) width[depth[n]] = (width[depth[n]] || 0) + 1
        for (const n of order)
                if (n in seeds) {
                        lo[n] = seeds[n]
                        hi[n] = seeds[n]
                } else {
                        lo[n] = Number.NEGATIVE_INFINITY
                        hi[n] = Number.POSITIVE_INFINITY
                }
        for (const n of order) {
                const base = n in seeds ? seeds[n] : lo[n]
                if (base === Number.NEGATIVE_INFINITY) continue
                for (const v of succ.get(n) || []) if (!(v in seeds)) lo[v] = Math.max(lo[v], base + 1)
        }
        for (let i = order.length - 1; i >= 0; i -= 1) {
                const n = order[i]
                const base = n in seeds ? seeds[n] : hi[n]
                if (base === Number.POSITIVE_INFINITY) continue
                for (const p of preds.get(n) || []) if (!(p in seeds)) hi[p] = Math.min(hi[p], base - 1)
        }
        const warns: string[] = []
        const items = { ...seeds } as Record<string, number>
        for (const n of order) {
                if (n in seeds) continue
                const l = lo[n]
                const h = hi[n]
                const hasL = l !== Number.NEGATIVE_INFINITY
                const hasH = h !== Number.POSITIVE_INFINITY
                let v: number
                if (!hasL && !hasH) {
                        const d = depth[n] || 0
                        const spread = width[d] > FAN_FLAT_LIMIT ? Math.max(1, Math.floor(STEP / (width[d] + 1))) : 0
                        const idx = (cursor[d] = (cursor[d] || 0) + 1)
                        v = START + d * STEP + spread * idx
                } else if (!hasH) v = (preds.get(n) || []).length ? l - 1 + STEP : hasL ? l : START
                else if (!hasL) {
                        v = h + 1 - STEP
                        if (v < 0) v = 0
                } else {
                        const gap = h - l
                        if (gap <= GAP_WARN) warns.push(`narrow gap ${n}`)
                        v = l + Math.max(1, gap >> 1)
                }
                if (hasH && v >= h) v = h - 1
                if (hasL && v <= l) v = l + 1
                items[n as K] = v
        }
        return { items, warns }
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
