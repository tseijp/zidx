import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const orderKeys = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => [...keys].sort((a, b) => ranks[a] - ranks[b])

const uniformGap = <K extends string>(ranks: Record<K, number>, keys: readonly K[]) => {
        const seq = orderKeys(ranks, keys)
        const gap = ranks[seq[1]] - ranks[seq[0]]
        for (let i = 2; i < seq.length; i += 1) expect(ranks[seq[i]] - ranks[seq[i - 1]]).toBe(gap)
        return { seq, gap }
}

describe('zidx topo features 1.0', () => {
        it('orders a three-node chain', () => {
                const ranks = zIndex((z) => [z('a', 'b', 'c')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(gap).toBeGreaterThan(0)
        })

        it('keeps sibling spacing even under one parent array', () => {
                const ranks = zIndex((z) => [z('a', ['b', 'c'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })

        it('merges two roots into one sink while keeping gaps even', () => {
                const ranks = zIndex((z) => [z('a', 'c'), z('b', 'c')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq[2]).toBe('c')
                expect(seq.slice(0, 2).sort()).toEqual(['a', 'b'])
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks[seq[1]] - ranks[seq[0]]).toBe(gap)
        })

        it('respects dense ordering when every relation is declared', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('a', 'c'), z('b', 'c')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })

        it('flattens nested pair arrays into the same topological order', () => {
                const ranks = zIndex((z) => [z('a', [z('b', 'c')])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })

        it('sorts correctly even when an ancestor pair arrives later', () => {
                const ranks = zIndex((z) => [z('b', 'c'), z('a', 'b')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })

        it('preserves explicit child order inside a sibling array', () => {
                const ranks = zIndex((z) => [z('a', ['c', 'b'])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'c', 'b'])
                expect(ranks.a).toBeLessThan(ranks.c)
                expect(ranks.c).toBeLessThan(ranks.b)
                expect(ranks.c - ranks.a).toBe(gap)
        })

        it('treats a child pair array as a rooted subtree', () => {
                const branch = zIndex((z) => [z('b', 'c')])
                const ranks = zIndex((z) => [z('a', [branch])])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })

        it('matches separated pair declarations with the same chain order', () => {
                const ranks = zIndex((z) => [z('a', 'b'), z('b', 'c')])
                const { seq, gap } = uniformGap(ranks, ['a', 'b', 'c'])

                expect(seq).toEqual(['a', 'b', 'c'])
                expect(ranks.a).toBeLessThan(ranks.b)
                expect(ranks.b).toBeLessThan(ranks.c)
                expect(ranks.c - ranks.b).toBe(gap)
        })
})
