import { describe, expect, it } from 'vitest'
import { dag, index, S } from './utils'

describe('five nodes', () => {
        describe('basic patterns', () => {
                it('chain: a < b < c < d < e', () => {
                        dag((z) => [z('a', 'b', 'c', 'd', 'e')])
                                .relative('a', 'b', 'c', 'd', 'e')
                                .edges(['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'e'])
                                .nowarn()
                })

                it('wide fan: a < [b,c,d,e]', () => {
                        dag((z) => [z('a', ['b', 'c', 'd', 'e'])])
                                .relative('a', ['b', 'c', 'd', 'e'])
                                .edges(['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'])
                                .nowarn()
                })

                it.skip('funnel: [a,b,c,d] < e', () => {
                        dag((z) => [z(['a', 'b', 'c', 'd'], 'e')])
                                .relative(['a', 'b', 'c', 'd'], 'e')
                                .edges(['a', 'e'], ['b', 'e'], ['c', 'e'], ['d', 'e'])
                })

                it('diamond tail: a < [b,c] then b,c < d then d < e', () => {
                        dag((z) => [z('a', ['b', 'c']), z('b', 'd'), z('c', 'd'), z('d', 'e')])
                                .relative('a', ['b', 'c'], 'd', 'e')
                                .edges(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e'])
                                .nowarn()
                })

                it('interleaved ladders: z("a","b","e"), z("a","c","d","e")', () => {
                        dag((z) => [z('a', 'b', 'e'), z('a', 'c', 'd', 'e')])
                                .edges(['a', 'b'], ['b', 'e'], ['a', 'c'], ['c', 'd'], ['d', 'e'])
                                .nowarn()
                })

                it('balanced two-level: z("a","b","d"), z("a","c","e")', () => {
                        dag((z) => [z('a', 'b', 'd'), z('a', 'c', 'e')])
                                .relative('a', ['b', 'c'], ['d', 'e'])
                                .edges(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'e'])
                                .nowarn()
                })

                it('fan with deep child: z("a",["b","c","d"]), z("d","e")', () => {
                        dag((z) => [z('a', ['b', 'c', 'd']), z('d', 'e')])
                                .edges(['a', 'b'], ['a', 'c'], ['a', 'd'], ['d', 'e'])
                                .nowarn()
                })

                it('diamond head: z("a","b"), z("b",["c","d"]), z("c","e"), z("d","e")', () => {
                        dag((z) => [z('a', 'b'), z('b', ['c', 'd']), z('c', 'e'), z('d', 'e')])
                                .relative('a', 'b', ['c', 'd'], 'e')
                                .edges(['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'e'], ['d', 'e'])
                                .nowarn()
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
                        const r = dag((z) => [z('a', 'b', 'c', 'd', 'e')]).nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })

                it('wide fan children are all same rank', () => {
                        const r = dag((z) => [z('a', ['b', 'c', 'd', 'e'])]).nowarn().raw
                        expect(r.b).toBe(r.c)
                        expect(r.c).toBe(r.d)
                        expect(r.d).toBe(r.e)
                })
        })

        describe('two disconnected components', () => {
                it('z("a","b"), z("c","d","e") are independent', () => {
                        const r = dag((z) => [z('a', 'b'), z('c', 'd', 'e')])
                                .edges(['a', 'b'], ['c', 'd'], ['d', 'e'])
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })
        })

        describe('diamond plus extra', () => {
                it('z("a","b"), z("a","c"), z("b","d"), z("c","d"), z("d","e")', () => {
                        dag((z) => [z('a', 'b'), z('a', 'c'), z('b', 'd'), z('c', 'd'), z('d', 'e')])
                                .relative('a', ['b', 'c'], 'd', 'e')
                                .edges(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e'])
                                .nowarn()
                })
        })

        describe('W-shape', () => {
                it('z("a","c"), z("b","c"), z("c","d"), z("c","e")', () => {
                        dag((z) => [z('a', 'c'), z('b', 'c'), z('c', 'd'), z('c', 'e')])
                                .relative(['a', 'b'], 'c', ['d', 'e'])
                                .edges(['a', 'c'], ['b', 'c'], ['c', 'd'], ['c', 'e'])
                                .nowarn()
                })
        })

        describe('cross pattern', () => {
                it('z("a","d"), z("a","e"), z("b","d"), z("b","e"), z("c","d")', () => {
                        dag((z) => [z('a', 'd'), z('a', 'e'), z('b', 'd'), z('b', 'e'), z('c', 'd')])
                                .edges(['a', 'd'], ['a', 'e'], ['b', 'd'], ['b', 'e'], ['c', 'd'])
                                .nowarn()
                })
        })

        describe('long chain with branch', () => {
                it('z("a","b","c","d"), z("b","e")', () => {
                        dag((z) => [z('a', 'b', 'c', 'd'), z('b', 'e')])
                                .edges(['a', 'b'], ['b', 'c'], ['c', 'd'], ['b', 'e'])
                                .nowarn()
                })
        })

        describe('fan in then fan out', () => {
                it('z("a","c"), z("b","c"), z("c","d"), z("c","e")', () => {
                        dag((z) => [z('a', 'c'), z('b', 'c'), z('c', 'd'), z('c', 'e')])
                                .relative(['a', 'b'], 'c', ['d', 'e'])
                                .edges(['a', 'c'], ['b', 'c'], ['c', 'd'], ['c', 'e'])
                                .nowarn()
                })
        })

        describe('two chains merging', () => {
                it('z("a","b","d"), z("a","c","d"), z("d","e")', () => {
                        dag((z) => [z('a', 'b', 'd'), z('a', 'c', 'd'), z('d', 'e')])
                                .relative('a', ['b', 'c'], 'd', 'e')
                                .edges(['a', 'b'], ['b', 'd'], ['a', 'c'], ['c', 'd'], ['d', 'e'])
                                .nowarn()
                })
        })
})
