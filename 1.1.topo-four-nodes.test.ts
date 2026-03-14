import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const orderKeys = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => [...keys].sort((a, b) => ranks[a] - ranks[b])

const uniformGap = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => {
        const seq = orderKeys(ranks, keys)
        const gap = ranks[seq[1]] - ranks[seq[0]]
        for (let i = 2; i < seq.length; i += 1) expect(ranks[seq[i]] - ranks[seq[i - 1]]).toBe(gap)
        return { seq, gap }
}

describe('zidx topo features 1.1', () => {
        it('orders a four-node chain', () => {
                const ranks = zIndex((z) => [z('a', 'b', 'c', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq).toEqual(['a', 'b', 'c', 'd'])
                expect(gap).toBeGreaterThan(0)
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.d)
        })

        it('spreads siblings evenly under a shared root', () => {
                const ranks = zIndex((z) => [z('a', ['b', 'c', 'd'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[0]).toBe('a')
                expect(seq.slice(1).sort()).toEqual(['b', 'c', 'd'])
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
                expect(ranks[seq[3]] - ranks[seq[2]]).toBe(gap)
        })

        it('forms a diamond that converges cleanly', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('a', 'c'), z('b', 'd'), z('c', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('d')
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.d)
                expect(ranks.c).toBeLessThan(ranks.d)
                expect(gap).toBeGreaterThan(0)
        })

        it('branches then forks again one level deeper', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('b', ['c', 'd'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[0]).toBe('a')
                expect(seq[1]).toBe('b')
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
                expect(ranks[seq[3]] - ranks[seq[2]]).toBe(gap)
        })

        it('merges dual roots into a chain tail', () => {
                const ranks = zIndex((z) => [z('a', 'c'), z('b', 'c'), z('c', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[seq.length - 1]).toBe('d')
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.d)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })

        it('keeps explicit sibling order when reversed', () => {
                const ranks = zIndex((z) => [z('a', ['d', 'c', 'b'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq).toEqual(['a', 'd', 'c', 'b'])
                expect(ranks.a).toBeLessThan(ranks.d)
                expect(ranks.d).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.b)
                expect(ranks.d - ranks.a).toBe(gap)
        })

        it('adds a cross brace to the ladder while keeping spacing', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('a', 'c'), z('b', 'c'), z('c', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[0]).toBe('a')
                expect(seq[seq.length - 1]).toBe('d')
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.d)
                expect(ranks[seq[2]] - ranks[seq[1]]).toBe(gap)
        })

        it('lets two chains meet at the final node', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('c', 'd'), z('b', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq[seq.length - 1]).toBe('d')
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.c).toBeLessThan(ranks.d)
                expect(ranks.b).toBeLessThan(ranks.d)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })

        it('supports parallel roots with independent tails', () => {
                const ranks = zIndex((z) => [z('a', 'c'), z('b', 'd')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c', 'd'])

                expect(seq).toEqual(['a', 'b', 'c', 'd'])
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.d)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })
})
