import { expect } from 'vitest'
import type { ZApi } from './index'

export const S = 1 << 10
export const mid = (lo: number, up: number) => lo + ((up - lo) >> 1)

const pack = <K extends string>(v: K | readonly K[]): K[] => (Array.isArray(v) ? [...v] : ([v] as K[]))

export const absolute = <K extends string>(r: ZApi<K>, ...pairs: readonly [K, K][]) => {
        for (const [a, b] of pairs) expect(r[a] as number).toBeLessThan(r[b] as number)
}

export const relative = <K extends string>(r: ZApi<K>, ...levels: (K | readonly K[])[]) => {
        const groups = levels.map(pack)
        for (const g of groups) for (let i = 1; i < g.length; i += 1) expect(r[g[0]]).toBe(r[g[i]])
        for (let i = 0; i < groups.length; i += 1) for (let j = i + 1; j < groups.length; j += 1) for (const a of groups[i]) for (const b of groups[j]) expect(r[a]).toBeLessThan(r[b])
}

export const order = (api: Record<string, number>, keys: string[]): string[] => [...keys].sort((a, b) => api[a] - api[b])

export const gap = (api: Record<string, number>, seq: string[]): number => (seq.length < 2 ? 0 : api[seq[1]] - api[seq[0]])
