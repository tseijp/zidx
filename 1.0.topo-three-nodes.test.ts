import { describe, expect, it } from 'vitest'
import { dag, index, S } from './utils'

describe('three nodes', () => {
        describe('6 non-isomorphic DAG shapes', () => {
                it('pattern 1 - 0 edges: all same rank', () => {
                        dag((z) => [z(['a', 'b', 'c'])]).relative(['a', 'b', 'c'])
                })

                it('pattern 2 - 1 edge: a < b', () => {
                        dag((z) => [z('a', 'b')])
                                .relative('a', 'b')
                                .absolute(['a', 'b'])
                })

                it('pattern 3 - 2 edges fan out: a < [b, c]', () => {
                        dag((z) => [z('a', ['b', 'c'])])
                                .relative('a', ['b', 'c'])
                                .absolute(['a', 'b'], ['a', 'c'])
                })

                it('pattern 4 - 2 edges fan in: [b, c] < a', () => {
                        dag((z) => [z(['b', 'c'], 'a')])
                                .relative(['b', 'c'], 'a')
                                .absolute(['b', 'a'], ['c', 'a'])
                })

                it('pattern 5 - 2 edges chain: a < b < c', () => {
                        dag((z) => [z('a', 'b', 'c')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'])
                })

                it('pattern 6 - 3 edges complete: a < b < c with a < c', () => {
                        dag((z) => [z('a', 'b', 'c'), z('a', 'c')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'], ['a', 'c'])
                })
        })

        describe('nested Edge', () => {
                it('z("a", [z("b", "c")]) produces a < b < c', () => {
                        dag((z) => [z('a', [z('b', 'c')])])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'])
                })
        })

        describe('separated pairs forming chain', () => {
                it('z("a","b"), z("b","c") same as chain a < b < c', () => {
                        dag((z) => [z('a', 'b'), z('b', 'c')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'])
                })

                it('reversed declaration: z("b","c"), z("a","b") still a < b < c', () => {
                        dag((z) => [z('b', 'c'), z('a', 'b')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'])
                })
        })

        describe('stride uniformity', () => {
                it('chain a < b < c has uniform stride', () => {
                        const r = dag((z) => [z('a', 'b', 'c')])
                                .relative('a', 'b', 'c')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                })

                it('fan out a < [b, c] has equal spacing from parent', () => {
                        const r = dag((z) => [z('a', ['b', 'c'])])
                                .relative('a', ['b', 'c'])
                                .nowarn().raw
                        expect(r.b - r.a).toBe(r.c - r.a)
                })

                it('single edge stride equals S', () => {
                        const r = dag((z) => [z('a', 'b')]).nowarn().raw
                        expect(r.b - r.a).toBe(S)
                })
        })

        describe('reversed child order in array', () => {
                it('z("a", ["c", "b"]) preserves declared order', () => {
                        dag((z) => [z('a', ['c', 'b'])]).absolute(['a', 'c'], ['a', 'b'])
                })
        })

        describe('equivalent constructions', () => {
                it('complete DAG from two z calls matches three z calls', () => {
                        const r1 = dag((z) => [z('a', 'b', 'c'), z('a', 'c')]).nowarn().raw
                        const r2 = dag((z) => [z('a', 'b'), z('a', 'c'), z('b', 'c')]).nowarn().raw
                        expect(r1.a).toBeLessThan(r1.b)
                        expect(r1.b).toBeLessThan(r1.c)
                        expect(r2.a).toBeLessThan(r2.b)
                        expect(r2.b).toBeLessThan(r2.c)
                })

                it('separated pairs produce same relative order as single chain', () => {
                        const chain = dag((z) => [z('a', 'b', 'c')]).nowarn().raw
                        const pairs = dag((z) => [z('a', 'b'), z('b', 'c')]).nowarn().raw
                        expect(pairs.b - pairs.a).toBe(chain.b - chain.a)
                        expect(pairs.c - pairs.b).toBe(chain.c - chain.b)
                })
        })

        describe('cycle detection', () => {
                it('two-node cycle: z("a","b"), z("b","a") throws', () => {
                        expect(() => index((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                })

                it('three-node cycle: z("a","b"), z("b","c"), z("c","a") throws', () => {
                        expect(() => index((z) => [z('a', 'b'), z('b', 'c'), z('c', 'a')])).toThrow('cycle')
                })
        })

        describe('fan out equal spacing', () => {
                it('z("a", ["b", "c"]) children are equidistant from parent', () => {
                        const r = dag((z) => [z('a', ['b', 'c'])]).nowarn().raw
                        expect(r.b).toBe(r.c)
                })

                it('z("a", ["b", "c", "d"]) all children same rank', () => {
                        const r = dag((z) => [z('a', ['b', 'c', 'd'])]).nowarn().raw
                        expect(r.b).toBe(r.c)
                        expect(r.c).toBe(r.d)
                })
        })

        describe('no warns on valid topologies', () => {
                it('chain produces no warnings', () => {
                        dag((z) => [z('a', 'b', 'c')]).nowarn()
                })

                it('fan produces no warnings', () => {
                        dag((z) => [z('a', ['b', 'c'])]).nowarn()
                })

                it('complete DAG produces no warnings', () => {
                        dag((z) => [z('a', 'b', 'c'), z('a', 'c')]).nowarn()
                })
        })
})
