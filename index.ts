type Pair = [string, string]
type Edge<T extends readonly unknown[] = readonly unknown[]> = readonly Pair[] & { [SYM]?: T }
type Node = string | Function | Edge | readonly Node[]
// prettier-ignore
type _Keys<T> = T extends string ? T :
        T extends Edge<infer U> ? _Keys<U> :
        T extends readonly (infer R)[] ? _Keys<R> :
        T extends Function ? Exclude<keyof T, keyof Function> :
        never
// prettier-ignore
type Keys<Ret> =
        Ret extends Edge<infer U> ? _Keys<U> :
        Ret extends readonly (infer R)[] ? Keys<R> :
        never
export type ZReq = unknown | unknown[] // Edge | Edge[] @TODO FIX: Instantiations: 29243 → 64816
export type ZRes<K extends string = string> = Record<K, number>
export type ZApi<K extends string = string> = ZExt<K> & ZRes<K>
export type ZFun = {
        <const T extends readonly string[]>(...args: T): Edge<T> // @MEMO Instantiations: 29637 →　29243
        <const T extends readonly Node[]>(...args: T): Edge<T>
}
export type ZExt<K extends string = string> = {
        <const Ret extends ZReq>(build: (z: ZFun) => Ret): ZApi<K | Keys<Ret>>
}
const SYM = Symbol('z')
const INF = 1 << 30
const STEP = 1 << 10
const START = STEP
const { max, min, floor } = Math
const clamp = (x: number, a: number, b: number) => min(max(x, a), b)
const edge = (p: Pair[]) => {
        // @ts-ignore
        p[SYM] = true
        return p
}
// @ts-ignore
const isEdge = (v: unknown): v is Edge => Array.isArray(v) && !!v[SYM]
const sources = (ps: readonly Pair[]): string[] => {
        const d = new Map<string, number>()
        for (const [a, b] of ps) {
                if (!d.has(a)) d.set(a, 0)
                d.set(b, (d.get(b) || 0) + 1)
        }
        const r: string[] = []
        for (const [k, v] of d) if (v === 0) r.push(k)
        return r
}
const gather = (n: Node): { entries: string[]; pairs: readonly Pair[] } => {
        if (typeof n === 'string') return { entries: [n], pairs: [] }
        if (typeof n === 'function') {
                // @ts-ignore
                const ks = Object.keys(n).sort((a, b) => n[a] - n[b])
                const p: Pair[] = []
                for (let i = 0; i < ks.length - 1; i += 1) p.push([ks[i], ks[i + 1]])
                return { entries: ks, pairs: p }
        }
        if (isEdge(n)) return { entries: sources(n), pairs: n }
        if (Array.isArray(n)) {
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
                for (let i = 0; i < parts.length - 1; i += 1) if (parts[i].n && parts[i + 1].n) for (const a of parts[i].e) for (const b of parts[i + 1].e) pairs.push([a, b])
                return { entries, pairs }
        }
        throw new Error('invalid node')
}
const z = (...args: Node[]): Edge => {
        const g = args.map(gather)
        const r: Pair[] = []
        for (const x of g) r.push(...x.pairs)
        for (let i = 0; i < g.length - 1; i += 1) for (const a of g[i].entries) for (const b of g[i + 1].entries) r.push([a, b])
        return edge(r)
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
        throw new Error('invalid pair')
}
const topo = (pairs: Pair[], extras: string[]) => {
        const succ = new Map<string, string[]>()
        const preds = new Map<string, string[]>()
        const indeg = new Map<string, number>()
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
                for (const v of succ.get(n)!) {
                        const d = indeg.get(v)! - 1
                        indeg.set(v, d)
                        if (d === 0) q.push(v)
                }
        }
        if (order.length !== indeg.size) throw new Error('cycle')
        return { order, preds, succ }
}
const assign = (pairs: Pair[], seeds: ZRes = {}): ZRes => {
        const { order, preds, succ } = topo(pairs, Object.keys(seeds))
        const lo: Record<string, number> = {}
        const hi: Record<string, number> = {}
        const depth: Record<string, number> = {}
        const width: Record<number, number> = {}
        const cursor: Record<number, number> = {}
        for (const n of order) depth[n] = 0
        for (const n of order) for (const v of succ.get(n)!) depth[v] = max(depth[v] || 0, (depth[n] || 0) + 1)
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
                if (base !== -INF) for (const v of succ.get(n)!) if (!(v in seeds)) lo[v] = max(lo[v], base + 1)
        }
        for (let i = order.length - 1; i >= 0; i -= 1) {
                const n = order[i]
                let base = hi[n]
                if (n in seeds) base = seeds[n]
                if (base !== INF) for (const p of preds.get(n)!) if (!(p in seeds)) hi[p] = min(hi[p], base - 1)
        }
        const items: ZRes = { ...seeds }
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
                        const hasPred = preds.get(n)!.length > 0
                        if (hasPred) v = l - 1 + STEP
                        else if (hasL) v = l
                        else v = START - STEP
                } else if (!hasL) v = max(1, (h + 1) >> 1)
                else {
                        const gap = h - l
                        // if (gap <= 1) throw `narrow gap ${n}` // @TODO FIX narrow gap
                        v = l + max(1, gap >> 1)
                }
                let low = -INF
                if (hasL) low = l + 1
                let high = INF
                if (hasH) high = h - 1
                items[n] = clamp(v, low, high)
        }
        return items
}
const api = (items: ZRes): ZApi => {
        const ext: ZExt = (build) => {
                const pairs: Pair[] = []
                collect(build(z as ZFun), pairs)
                const next = assign(pairs, items)
                return api(next)
        }
        return Object.assign(ext, items)
}
export function index<const Ret extends ZReq>(build: (z: ZFun) => Ret): ZApi<Keys<Ret>> {
        const pairs: Pair[] = []
        collect(build(z as ZFun), pairs)
        return api(assign(pairs))
}
export default index
