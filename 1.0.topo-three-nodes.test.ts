import { describe, expect, it } from 'vitest'
import { index } from './index'
import { absolute, relative, S } from './utils'

describe('three nodes', () => {
        describe('6 non-isomorphic DAG shapes', () => {
                it('pattern 1 - 0 edges: all same rank', () => {
                        const r = index((z) => z(['a', 'b', 'c']))
                        relative(r, ['a', 'b', 'c']) // @ts-expect-error
                        r._
                })

                it('pattern 2 - 1 edge: a < b', () => {
                        const r = index((z) => z('a', 'b'))
                        relative(r, 'a', 'b')
                        absolute(r, ['a', 'b']) // @ts-expect-error
                        r._
                })

                it('pattern 3 - 2 edges fan out: a < [b, c]', () => {
                        const r = index((z) => z('a', ['b', 'c']))
                        relative(r, 'a', ['b', 'c'])
                        absolute(r, ['a', 'b'], ['a', 'c']) // @ts-expect-error
                        r._
                })

                it('pattern 4 - 2 edges fan in: [b, c] < a', () => {
                        const r = index((z) => z(['b', 'c'], 'a'))
                        relative(r, ['b', 'c'], 'a')
                        absolute(r, ['b', 'a'], ['c', 'a']) // @ts-expect-error
                        r._
                })

                it('pattern 5 - 2 edges chain: a < b < c', () => {
                        const r = index((z) => z('a', 'b', 'c'))
                        relative(r, 'a', 'b', 'c')
                        absolute(r, ['a', 'b'], ['b', 'c']) // @ts-expect-error
                        r._
                })

                it('pattern 6 - 3 edges complete: a < b < c with a < c', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('a', 'c')])
                        relative(r, 'a', 'b', 'c')
                        absolute(r, ['a', 'b'], ['b', 'c'], ['a', 'c']) // @ts-expect-error
                        r._
                })
        })

        describe('nested Edge', () => {
                it('z("a", [z("b", "c")]) produces a < b < c', () => {
                        const r = index((z) => z('a', [z('b', 'c')]))
                        relative(r, 'a', 'b', 'c')
                        absolute(r, ['a', 'b'], ['b', 'c']) // @ts-expect-error
                        r._
                })
        })

        describe('separated pairs forming chain', () => {
                it('z("a","b"), z("b","c") same as chain a < b < c', () => {
                        const r = index((z) => [z('a', 'b'), z('b', 'c')])
                        relative(r, 'a', 'b', 'c')
                        absolute(r, ['a', 'b'], ['b', 'c']) // @ts-expect-error
                        r._
                })

                it('reversed declaration: z("b","c"), z("a","b") still a < b < c', () => {
                        const r = index((z) => [z('b', 'c'), z('a', 'b')])
                        relative(r, 'a', 'b', 'c')
                        absolute(r, ['a', 'b'], ['b', 'c']) // @ts-expect-error
                        r._
                })
        })

        describe('stride uniformity', () => {
                it('chain a < b < c has uniform stride', () => {
                        const r = index((z) => z('a', 'b', 'c'))
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                })

                it('fan out a < [b, c] has equal spacing from parent', () => {
                        const r = index((z) => z('a', ['b', 'c']))
                        relative(r, 'a', ['b', 'c']) // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(r.c - r.a)
                })

                it('single edge stride equals S', () => {
                        const r = index((z) => z('a', 'b')) // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                })
        })

        describe('reversed child order in array', () => {
                it('z("a", ["c", "b"]) preserves declared order', () => {
                        const r = index((z) => z('a', ['c', 'b']))
                        absolute(r, ['a', 'c'], ['a', 'b']) // @ts-expect-error
                        r._
                })
        })

        describe('equivalent constructions', () => {
                it('complete DAG from two z calls matches three z calls', () => {
                        const r1 = index((z) => [z('a', 'b', 'c'), z('a', 'c')])
                        const r2 = index((z) => [z('a', 'b'), z('a', 'c'), z('b', 'c')])
                        expect(r1.a).toBeLessThan(r1.b)
                        expect(r1.b).toBeLessThan(r1.c)
                        expect(r2.a).toBeLessThan(r2.b)
                        expect(r2.b).toBeLessThan(r2.c)
                })

                it('separated pairs produce same relative order as single chain', () => {
                        const chain = index((z) => z('a', 'b', 'c'))
                        const pairs = index((z) => [z('a', 'b'), z('b', 'c')])
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
                        const r = index((z) => z('a', ['b', 'c'])) // @ts-expect-error
                        r._
                        expect(r.b).toBe(r.c)
                })

                it('z("a", ["b", "c", "d"]) all children same rank', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd'])) // @ts-expect-error
                        r._
                        expect(r.b).toBe(r.c)
                        expect(r.c).toBe(r.d)
                })
        })

        describe('no warns on valid topologies', () => {
                it('chain produces no warnings', () => {
                        const r = index((z) => z('a', 'b', 'c')) // @ts-expect-error
                        r._
                })

                it('fan produces no warnings', () => {
                        const r = index((z) => z('a', ['b', 'c'])) // @ts-expect-error
                        r._
                })

                it('complete DAG produces no warnings', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('a', 'c')]) // @ts-expect-error
                        r._
                })
        })
})
