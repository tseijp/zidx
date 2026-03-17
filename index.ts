/**
 * Turn partial-order z-relations into numeric ranks;
 * preserve seeded keys while inserting newcomers via midpoint splits;
 * accept linear chains or tree shorthands and lift key names for inference.
 */
type Pair = readonly [string, string]
declare const ZTag: unique symbol
type TaggedPairs<T extends readonly [unknown, ...unknown[]] = readonly [unknown, ...unknown[]]> = Pair[] & { [ZTag]?: T }
type Node = string | TaggedPairs<any> | readonly Node[]
type KeysOf<T> = T extends string ? T : T extends TaggedPairs<infer U> ? KeysOf<U> : T extends readonly (infer R)[] ? KeysOf<R> : never
type Keys<P> = P extends TaggedPairs<infer U> ? KeysOf<U> : P extends readonly (infer R)[] ? Keys<R> : never
type ZRes<K extends string> = { items: Record<K, number>; warns: string[] }
type ZExt<K extends string> = <P extends readonly unknown[]>(build: (z: ZPair) => P) => ZApi<K | Keys<P>>
type ZApi<K extends string> = ZExt<K> & Record<K, number> & { warns: string[] }
type ZPair = {
        <C extends readonly [Node, ...Node[]], A extends string>(lower: A, children: readonly [...C]): TaggedPairs<[A, ...C]>
        <T extends readonly [string, string, ...string[]]>(...keys: T): TaggedPairs<T>
}
const STEP = 1 << 10
const INF = 1 << 30
const { max, min } = Math
const clamp = (x: number, a: number, b: number): number => (x < a ? a : x > b ? b : x)
const isPair = (v: unknown): v is Pair => Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string'
const rootOfPairs = (arr: Pair[]): string => (arr.length ? arr[0][0] : '')
const pair: ZPair = ((...keys: readonly [string, ...Node[]] | readonly [string, string, ...string[]]) => {
        const res: Pair[] = []
        const parent = keys[0] as string
        const link = (p: string, node: Node): void => {
                if (typeof node === 'string') {
                        res.push([p, node])
                        return
                }
                if (Array.isArray(node)) {
                        if (node.length && isPair(node[0])) {
                                const root = rootOfPairs(node as Pair[])
                                if (root) res.push([p, root])
                                for (const e of node as Pair[]) res.push(e)
                                return
                        }
                        for (const v of node) link(p, v as Node)
                        return
                }
                throw new Error('invalid node')
        }
        if (keys.length === 2) link(parent, keys[1] as Node)
        else {
                for (let i = 0; i < keys.length - 1; i += 1) {
                        const a = keys[i]
                        const b = keys[i + 1]
                        if (typeof a !== 'string' || typeof b !== 'string') throw new Error('linear keys must be strings')
                        res.push([a, b])
                }
        }
        return res as TaggedPairs<typeof keys>
}) as ZPair
const flatten = (input: unknown, out: Pair[]): void => {
        if (Array.isArray(input)) {
                if (isPair(input)) {
                        out.push(input)
                        return
                }
                for (const v of input) flatten(v, out)
                return
        }
        throw new Error('invalid pair')
}
const topo = (pairs: Pair[], extras: string[]) => {
        const indeg = new Map<string, number>()
        const adj = new Map<string, string[]>()
        for (const k of extras) {
                if (!adj.has(k)) adj.set(k, [])
                if (!indeg.has(k)) indeg.set(k, 0)
        }
        for (const [a, b] of pairs) {
                if (!adj.has(a)) adj.set(a, [])
                if (!adj.has(b)) adj.set(b, [])
                if (!indeg.has(a)) indeg.set(a, 0)
                if (!indeg.has(b)) indeg.set(b, 0)
                adj.get(a)!.push(b)
                indeg.set(b, (indeg.get(b) || 0) + 1)
        }
        const q: string[] = []
        for (const [k, v] of indeg) if (v === 0) q.push(k)
        const order: string[] = []
        for (const n of q) {
                order.push(n)
                for (const m of adj.get(n) || []) {
                        const d = (indeg.get(m) || 0) - 1
                        indeg.set(m, d)
                        if (d === 0) q.push(m)
                }
        }
        if (order.length !== indeg.size) throw new Error('cycle')
        return { order, adj }
}
const downer = (pairs: Pair[]) => {
        const down = new Map<string, string[]>()
        for (const [a, b] of pairs) {
                if (!down.has(b)) down.set(b, [])
                down.get(b)!.push(a)
                if (!down.has(a)) down.set(a, [])
        }
        return down
}
const safely = (primary: number, secondary = 0): number => {
        if (primary === INF || primary === -INF) return secondary
        return primary
}
const lower = (lo: number, fences: number[]) => (lo !== -INF ? lo : fences.length ? fences[0] - STEP : 0)
const upper = (up: number, lo: number, fences: number[]) => {
        if (up !== INF) return up
        if (fences.length) return fences[fences.length - 1] + STEP
        return lo + STEP
}
const bound = (arr: number[], v: number): number => {
        let l = 0
        let r = arr.length
        for (; l < r; ) {
                const m = (l + r) >> 1
                if (arr[m] < v) l = m + 1
                else r = m
        }
        return l
}
const fence = (seeds: number[], lo: number, up: number): [number, number] => {
        if (!seeds.length) return [lo, up]
        const idx = bound(seeds, lo + 1)
        if (idx >= seeds.length) return [lo, up]
        const seed = seeds[idx]
        if (seed >= up) return [lo, up]
        return [clamp(seeds[idx - 1] ?? lo, lo, up), clamp(seed, lo, up)]
}
const assign = <K extends string>(pairs: Pair[], seeds?: Record<K, number>): ZRes<K> => {
        if (!seeds) {
                const { order } = topo(pairs, [])
                const items = {} as Record<K, number>
                for (let i = 0; i < order.length; i += 1) items[order[i] as K] = i * STEP
                return { items, warns: [] }
        }
        const warns: string[] = []
        const { order, adj } = topo(pairs, Object.keys(seeds))
        const down = downer(pairs)
        const [_lo, _up]: Record<string, number>[] = [{}, {}]
        for (const k of order) {
                const key = k as K
                if (key in seeds) {
                        _lo[key] = _up[key] = seeds[key]
                        continue
                }
                _lo[key] = -INF
                _up[key] = INF
        }
        for (const k of order) {
                const base = safely(_lo[k])
                for (const s of adj.get(k) || []) _lo[s] = max(_lo[s], base + 1)
        }
        for (let i = order.length - 1; i >= 0; i -= 1) {
                const k = order[i]
                const base = safely(_up[k], _lo[k])
                for (const p of down.get(k) || []) _up[p] = min(_up[p], base - 1)
        }
        const items = { ...seeds }
        const fences = Object.values(seeds) as number[]
        fences.sort((a, b) => a - b)
        for (const k of order) {
                if (k in seeds) continue
                let lo = lower(_lo[k], fences)
                let up = upper(_up[k], lo, fences)
                ;[lo, up] = fence(fences, lo, up)
                const gap = up - lo
                if (gap <= 4) warns.push(`narrow gap ${k}`)
                items[k as K] = up
                if (gap > 1) items[k as K] = clamp(lo + (gap >> 1), lo + 1, up - 1)
        }
        return { items, warns }
}
const api = <K extends string>({ items, warns }: ZRes<K>): ZApi<K> => {
        const ext = <P extends readonly unknown[]>(build: (z: ZPair) => P): ZApi<K | Keys<P>> => {
                const pairs: Pair[] = []
                for (const item of build(pair)) flatten(item, pairs)
                const next = assign<K | Keys<P>>(pairs, items as Record<K | Keys<P>, number>)
                return api<K | Keys<P>>({ items: next.items, warns: [...warns, ...next.warns] })
        }
        return Object.assign(ext, { ...items, warns })
}
export function index<P extends readonly unknown[]>(build: (z: ZPair) => P): ZApi<Keys<P>> {
        const pairs: Pair[] = []
        for (const item of build(pair)) flatten(item, pairs)
        return api<Keys<P>>(assign<Keys<P>>(pairs))
}

export default index
