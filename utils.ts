import { expect } from 'vitest'
import index from './index'

export { index }
export const S = 1 << 10
export const mid = (lo: number, up: number) => lo + ((up - lo) >> 1)

type Level = string | readonly string[]
type Edge = readonly [string, string]
const pack = (v: Level): string[] => (Array.isArray(v) ? ([...v] as string[]) : [v as string])

export const dag = (build: (z: any) => readonly unknown[]) => {
        const r = index(build as any) as any
        const self = {
                raw: r,
                relative(...levels: Level[]) {
                        const groups = levels.map(pack)
                        for (const g of groups) for (let i = 1; i < g.length; i += 1) expect(r[g[0]]).toBe(r[g[i]])
                        for (let i = 0; i < groups.length; i += 1) for (let j = i + 1; j < groups.length; j += 1) for (const a of groups[i]) for (const b of groups[j]) expect(r[a]).toBeLessThan(r[b])
                        return self
                },
                absolute(...pairs: Edge[]) {
                        for (const [a, b] of pairs) expect(r[a] as number).toBeLessThan(r[b] as number)
                        return self
                },
                nowarn() {
                        expect(r.warns).toEqual([])
                        return self
                },
        }
        return self
}

export const order = (api: Record<string, number>, keys: string[]): string[] => [...keys].sort((a, b) => api[a] - api[b])

export const gap = (api: Record<string, number>, seq: string[]): number => (seq.length < 2 ? 0 : api[seq[1]] - api[seq[0]])

export type { Level, Edge }
