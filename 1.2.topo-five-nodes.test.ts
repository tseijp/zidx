import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const orderKeys = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => [...keys].sort((a, b) => ranks[a] - ranks[b])

const uniformGap = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => {
        const seq = orderKeys(ranks, keys)
        const gap = ranks[seq[1]] - ranks[seq[0]]
        for (let i = 2; i < seq.length; i += 1) expect(ranks[seq[i]] - ranks[seq[i - 1]]).toBe(gap)
        return { seq, gap }
}

describe('zidx topo features 1.2', () => {
        it('orders a five-node chain', () => {
                const ranks = zIndex((z) => [z('a', 'b', 'c', 'd', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq).toEqual(['a', 'b', 'c', 'd', 'e'])
                expect(gap).toBeGreaterThan(0)
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.d).toBeLessThan(ranks.e)
        })

        it('fans out from one root to four leaves', () => {
                const ranks = zIndex((z) => [z('a', ['b', 'c', 'd', 'e'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq.slice(1).sort()).toEqual(['b', 'c', 'd', 'e'])
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
                expect(ranks[seq[3]] - ranks[seq[2]]).toBe(gap)
                expect(ranks[seq[4]] - ranks[seq[3]]).toBe(gap)
        })

        it('funnels four sources into one sink', () => {
                const ranks = zIndex((z) => [z('a', 'e'), z('b', 'e'), z('c', 'e'), z('d', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[seq.length - 1]).toBe('e')
                expect(seq.slice(0, 4).sort()).toEqual(['a', 'b', 'c', 'd'])
                expect(ranks.a).toBeLessThan(ranks.e)
                expect(ranks.d).toBeLessThan(ranks.e)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })

        it('forms a diamond with a tail', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('a', 'c'), z('b', 'd'), z('c', 'd'), z('d', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('e')
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.d).toBeLessThan(ranks.e)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
        })

        it('interleaves two ladders that meet at the end', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('b', 'e'), z('a', 'c'), z('c', 'd'), z('d', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('e')
                expect(ranks.b).toBeGreaterThan(ranks.a)
                expect(ranks.c).toBeGreaterThan(ranks.a)
                expect(ranks.d).toBeGreaterThan(ranks.c)
                expect(ranks.e).toBeGreaterThan(ranks.d)
                expect(ranks[seq[3]] - ranks[seq[2]]).toBe(gap)
        })

        it('builds a balanced two-level tree', () => {
                const ranks = zIndex((z) => [z('a', ['b', 'c']), z('b', 'd'), z('c', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq.slice(1, 3).sort()).toEqual(['b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.d).toBeGreaterThan(ranks.b)
                expect(ranks.e).toBeGreaterThan(ranks.c)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
        })

        it('fans out then extends one child further', () => {
                const ranks = zIndex((z) => [z('a', ['b', 'c', 'd']), z('d', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('e')
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.a).toBeLessThan(ranks.d)
                expect(ranks.d).toBeLessThan(ranks.e)
                expect(ranks[seq[3]] - ranks[seq[2]]).toBe(gap)
        })

        it('ties two sources into one mid node that splits again', () => {
                const ranks = zIndex((z) => [z('a', 'c'), z('b', 'c'), z('c', ['d', 'e'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[2]).toBe('c')
                expect(seq.slice(0, 2).sort()).toEqual(['a', 'b'])
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.d)
                expect(ranks.c).toBeLessThan(ranks.e)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })

        it('weaves a zigzag with a cross-link to the sink', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('b', 'c'), z('a', 'd'), z('d', 'e'), z('c', 'e')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd', 'e'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('e')
                expect(ranks.b).toBeGreaterThan(ranks.a)
                expect(ranks.c).toBeGreaterThan(ranks.b)
                expect(ranks.d).toBeGreaterThan(ranks.a)
                expect(ranks.e).toBeGreaterThan(ranks.c)
                expect(ranks[seq[4]] - ranks[seq[3]]).toBe(gap)
        })
})
