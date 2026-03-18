import { describe, expect, it } from 'vitest'
import { index } from './index'
import { absolute, relative, S } from './utils'

describe('five nodes', () => {
        describe('basic patterns', () => {
                it('chain: a < b < c < d < e', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e'))
                        relative(r, 'a', 'b', 'c', 'd', 'e')
                        absolute(r, ['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('wide fan: a < [b,c,d,e]', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd', 'e']))
                        relative(r, 'a', ['b', 'c', 'd', 'e'])
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e']) // @ts-expect-error
                        r._
                })

                it('funnel: [a,b,c,d] < e', () => {
                        const r = index((z) => z(['a', 'b', 'c', 'd'], 'e'))
                        relative(r, ['a', 'b', 'c', 'd'], 'e')
                        absolute(r, ['a', 'e'], ['b', 'e'], ['c', 'e'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('diamond tail: a < [b,c] then b,c < d then d < e', () => {
                        const r = index((z) => [z('a', ['b', 'c']), z('b', 'd'), z('c', 'd'), z('d', 'e')])
                        relative(r, 'a', ['b', 'c'], 'd', 'e')
                        absolute(r, ['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('interleaved ladders: z("a","b","e"), z("a","c","d","e")', () => {
                        const r = index((z) => [z('a', 'b', 'e'), z('a', 'c', 'd', 'e')])
                        relative(r, 'a', ['b', 'c'], 'd', 'e')
                        absolute(r, ['a', 'b'], ['b', 'e'], ['a', 'c'], ['c', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('balanced two-level: z("a","b","d"), z("a","c","e")', () => {
                        const r = index((z) => [z('a', 'b', 'd'), z('a', 'c', 'e')])
                        relative(r, 'a', ['b', 'c'], ['d', 'e'])
                        absolute(r, ['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'e']) // @ts-expect-error
                        r._
                })

                it('fan with deep child: z("a",["b","c","d"]), z("d","e")', () => {
                        const r = index((z) => [z('a', ['b', 'c', 'd']), z('d', 'e')])
                        relative(r, 'a', ['b', 'c', 'd'], 'e')
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('diamond head: z("a","b"), z("b",["c","d"]), z("c","e"), z("d","e")', () => {
                        const r = index((z) => [z('a', 'b'), z('b', ['c', 'd']), z('c', 'e'), z('d', 'e')])
                        relative(r, 'a', 'b', ['c', 'd'], 'e')
                        absolute(r, ['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'e'], ['d', 'e']) // @ts-expect-error
                        r._
                })
        })

        describe('cycle detection', () => {
                it('five-node cycle: chain plus back edge throws', () => {
                        expect(() => index((z) => [z('a', 'b', 'c', 'd', 'e'), z('e', 'a')])).toThrow('cycle')
                })

                it('partial cycle in five nodes throws', () => {
                        expect(() => index((z) => [z('a', 'b', 'c'), z('c', 'a'), z('d', 'e')])).toThrow('cycle')
                })
        })

        describe('stride uniformity', () => {
                it('chain stride is constant across all gaps', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e')) // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })

                it('wide fan children are all same rank', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd', 'e'])) // @ts-expect-error // @ts-expect-error
                        r._
                        expect(r.b).toBe(r.c)
                        expect(r.c).toBe(r.d)
                        expect(r.d).toBe(r.e)
                })
        })

        describe('two disconnected components', () => {
                it('z("a","b"), z("c","d","e") are independent', () => {
                        const r = index((z) => [z('a', 'b'), z('c', 'd', 'e')])
                        absolute(r, ['a', 'b'], ['c', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })
        })

        describe('diamond plus extra', () => {
                it('z("a","b"), z("a","c"), z("b","d"), z("c","d"), z("d","e")', () => {
                        const r = index((z) => [z('a', 'b'), z('a', 'c'), z('b', 'd'), z('c', 'd'), z('d', 'e')])
                        relative(r, 'a', ['b', 'c'], 'd', 'e')
                        absolute(r, ['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e'])
                })
        })

        describe('W-shape', () => {
                it('z("a","c"), z("b","c"), z("c","d"), z("c","e")', () => {
                        const r = index((z) => [z('a', 'c'), z('b', 'c'), z('c', 'd'), z('c', 'e')])
                        relative(r, ['a', 'b'], 'c', ['d', 'e'])
                        absolute(r, ['a', 'c'], ['b', 'c'], ['c', 'd'], ['c', 'e']) // @ts-expect-error
                        r._
                })
        })

        describe('cross pattern', () => {
                it('z("a","d"), z("a","e"), z("b","d"), z("b","e"), z("c","d")', () => {
                        const r = index((z) => [z('a', 'd'), z('a', 'e'), z('b', 'd'), z('b', 'e'), z('c', 'd')])
                        relative(r, ['a', 'b', 'c'], ['d', 'e'])
                        absolute(r, ['a', 'd'], ['a', 'e'], ['b', 'd'], ['b', 'e'], ['c', 'd']) // @ts-expect-error
                        r._
                })
        })

        describe('long chain with branch', () => {
                it('z("a","b","c","d"), z("b","e")', () => {
                        const r = index((z) => [z('a', 'b', 'c', 'd'), z('b', 'e')])
                        relative(r, 'a', 'b', ['c', 'e'], 'd')
                        absolute(r, ['a', 'b'], ['b', 'c'], ['c', 'd'], ['b', 'e']) // @ts-expect-error
                        r._
                })
        })

        describe('two chains merging', () => {
                it('z("a","b","d"), z("a","c","d"), z("d","e")', () => {
                        const r = index((z) => [z('a', 'b', 'd'), z('a', 'c', 'd'), z('d', 'e')])
                        relative(r, 'a', ['b', 'c'], 'd', 'e')
                        absolute(r, ['a', 'b'], ['b', 'd'], ['a', 'c'], ['c', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })
        })
})
