import { describe, expect, it } from 'vitest'
import { dag, index, S } from './utils'

describe('four nodes', () => {
        describe('6 edges', () => {
                it('complete DAG: a < b < c < d with all transitive edges', () => {
                        dag((z) => [z('a', ['b', 'c', 'd']), z('b', ['c', 'd']), z('c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'], ['c', 'd'])
                })
        })

        describe('5 edges', () => {
                it('5e-1: a fan to [b,c,d] plus b fan to [c,d]', () => {
                        // AssertionError: expected 2048 to be 3072 // Object.is equality

                        // - Expected
                        // + Received

                        // - 3072
                        // + 2048
                        dag((z) => [z('a', ['b', 'c', 'd']), z('b', ['c', 'd'])])
                                .relative('a', 'b', ['c', 'd'])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'])
                })

                it('5e-2: a fan to [b,c,d] plus b chain c chain d', () => {
                        dag((z) => [z('a', ['b', 'c', 'd']), z('b', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'], ['c', 'd'])
                })

                it.skip('5e-3: a fan to [b,c,d] plus [b,c] < d', () => {
                        dag((z) => [z('a', ['b', 'c', 'd']), z(['b', 'c'], 'd')])
                                .relative('a', ['b', 'c'], 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'd'], ['c', 'd'])
                })

                it('5e-4: a chain b fan [c,d] plus a chain c chain d', () => {
                        // Error: linear keys must be strings
                        dag((z) => [z('a', 'b', ['c', 'd']), z('a', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'c'], ['b', 'd'], ['c', 'd'])
                })

                it.skip('5e-5: a chain b fan [c,d] plus [a,c] < d', () => {
                        dag((z) => [z('a', 'b', ['c', 'd']), z(['a', 'c'], 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'd'], ['b', 'c'], ['b', 'd'], ['c', 'd'])
                })

                it('5e-6: a fan [c,d] plus b fan [c,d] plus c chain d', () => {
                        // AssertionError: expected +0 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 0
                        dag((z) => [z('a', ['c', 'd']), z('b', ['c', 'd']), z('c', 'd')])
                                .relative(['a', 'b'], 'c', 'd')
                                .absolute(['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'], ['c', 'd'])
                })
        })

        describe('4 edges', () => {
                it('4e-1: a fan [b,c,d] plus b chain c', () => {
                        // AssertionError: expected 1024 to be 2048 // Object.is equality

                        // - Expected
                        // + Received

                        // - 2048
                        // + 1024
                        dag((z) => [z('a', ['b', 'c', 'd']), z('b', 'c')])
                                .relative('a', ['b', 'd'], 'c')
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'c'])
                })

                it('4e-2: a fan [b,c] plus b fan [c,d]', () => {
                        // AssertionError: expected 2048 to be 3072 // Object.is equality

                        // - Expected
                        // + Received

                        // - 3072
                        // + 2048
                        dag((z) => [z('a', ['b', 'c']), z('b', ['c', 'd'])])
                                .relative('a', 'b', ['c', 'd'])
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'c'], ['b', 'd'])
                })

                it('4e-3: a fan [c,d] plus b fan [c,d]', () => {
                        // AssertionError: expected +0 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 0
                        dag((z) => [z('a', ['c', 'd']), z('b', ['c', 'd'])])
                                .relative(['a', 'b'], ['c', 'd'])
                                .absolute(['a', 'c'], ['a', 'd'], ['b', 'c'], ['b', 'd'])
                })

                it('4e-4: a fan [b,c] plus b chain c chain d', () => {
                        dag((z) => [z('a', ['b', 'c']), z('b', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'c'], ['c', 'd'])
                })

                it('4e-5: a fan [b,d] plus b chain c chain d', () => {
                        dag((z) => [z('a', ['b', 'd']), z('b', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['a', 'd'], ['b', 'c'], ['c', 'd'])
                })

                it('4e-6: a fan [c,d] plus b chain c chain d', () => {
                        // AssertionError: expected +0 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 0
                        dag((z) => [z('a', ['c', 'd']), z('b', 'c', 'd')])
                                .relative(['a', 'b'], 'c', 'd')
                                .absolute(['a', 'c'], ['a', 'd'], ['b', 'c'], ['c', 'd'])
                })

                it.skip('4e-7: a fan [b,c] plus [b,c] < d', () => {
                        dag((z) => [z('a', ['b', 'c']), z(['b', 'c'], 'd')])
                                .relative('a', ['b', 'c'], 'd')
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'])
                })

                it.skip('4e-8: a fan [c,d] plus [b,c] < d', () => {
                        dag((z) => [z('a', ['c', 'd']), z(['b', 'c'], 'd')])
                                .relative(['a', 'b'], 'c', 'd')
                                .absolute(['a', 'c'], ['a', 'd'], ['b', 'd'], ['c', 'd'])
                })

                it('4e-9: a chain b chain c chain d plus b chain d', () => {
                        dag((z) => [z('a', 'b', 'c', 'd'), z('b', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'], ['c', 'd'])
                })
        })

        describe('3 edges', () => {
                it('3e-1: a fan [b,c,d]', () => {
                        // AssertionError: expected 1024 to be 2048 // Object.is equality

                        // - Expected
                        // + Received

                        // - 2048
                        // + 1024
                        dag((z) => [z('a', ['b', 'c', 'd'])])
                                .relative('a', ['b', 'c', 'd'])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'])
                                .nowarn()
                })

                it('3e-2: a fan [b,c] plus b chain c', () => {
                        dag((z) => [z('a', ['b', 'c']), z('b', 'c')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'c'])
                                .nowarn()
                })

                it('3e-3: a fan [c,d] plus b chain c', () => {
                        dag((z) => [z('a', ['c', 'd']), z('b', 'c')])
                                .absolute(['a', 'c'], ['a', 'd'], ['b', 'c'])
                                .nowarn()
                })

                it('3e-4: a chain b plus b fan [c,d]', () => {
                        // AssertionError: expected 2048 to be 3072 // Object.is equality

                        // - Expected
                        // + Received

                        // - 3072
                        // + 2048
                        dag((z) => [z('a', 'b'), z('b', ['c', 'd'])])
                                .relative('a', 'b', ['c', 'd'])
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'])
                                .nowarn()
                })

                it('3e-5: a chain b chain c chain d', () => {
                        dag((z) => [z('a', 'b', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .absolute(['a', 'b'], ['b', 'c'], ['c', 'd'])
                                .nowarn()
                })

                it.skip('3e-6: [a,b] chain c chain d', () => {
                        dag((z) => [z(['a', 'b'], 'c', 'd')])
                                .relative(['a', 'b'], 'c', 'd')
                                .absolute(['a', 'c'], ['b', 'c'], ['c', 'd'])
                })

                it('3e-7: a chain d plus b chain c chain d', () => {
                        dag((z) => [z('a', 'd'), z('b', 'c', 'd')])
                                .absolute(['a', 'd'], ['b', 'c'], ['c', 'd'])
                                .nowarn()
                })

                it.skip('3e-8: [a,b,c] < d', () => {
                        dag((z) => [z(['a', 'b', 'c'], 'd')])
                                .relative(['a', 'b', 'c'], 'd')
                                .absolute(['a', 'd'], ['b', 'd'], ['c', 'd'])
                })
        })

        describe('2 edges', () => {
                it('2e-1: chain a < b < c (d unconstrained)', () => {
                        dag((z) => [z('a', 'b', 'c')])
                                .relative('a', 'b', 'c')
                                .absolute(['a', 'b'], ['b', 'c'])
                })

                it('2e-2: fan a < [b,c] (d unconstrained)', () => {
                        // AssertionError: expected 1024 to be 2048 // Object.is equality

                        // - Expected
                        // + Received

                        // - 2048
                        // + 1024
                        dag((z) => [z('a', ['b', 'c'])])
                                .relative('a', ['b', 'c'])
                                .absolute(['a', 'b'], ['a', 'c'])
                })

                it.skip('2e-3: [a,b] < c (d unconstrained)', () => {
                        dag((z) => [z(['a', 'b'], 'c')])
                                .relative(['a', 'b'], 'c')
                                .absolute(['a', 'c'], ['b', 'c'])
                })

                it('2e-4: two disconnected edges a < d and b < c', () => {
                        // AssertionError: expected +0 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 0
                        dag((z) => [z('a', 'd'), z('b', 'c')])
                                .relative(['a', 'b'], ['c', 'd'])
                                .absolute(['a', 'd'], ['b', 'c'])
                })
        })

        describe('1 edge', () => {
                it('1e-1: single edge a < b (c,d unconstrained)', () => {
                        // AssertionError: expected +0 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 0
                        dag((z) => [z('a', 'b')])
                                .relative(['a', 'b', 'c'], 'b')
                                .absolute(['a', 'b'])
                                .nowarn()
                })
        })

        describe('0 edges', () => {
                it.skip('0e-1: all same rank [a,b,c,d]', () => {
                        dag((z) => [z(['a', 'b', 'c', 'd'])])
                                .relative(['a', 'b', 'c', 'd'])
                                .absolute()
                })
        })

        describe('stride uniformity', () => {
                it('four-node chain has uniform stride S', () => {
                        const r = dag((z) => [z('a', 'b', 'c', 'd')]).nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('fan a < [b,c,d] children share same rank', () => {
                        // AssertionError: expected 1024 to be 2048 // Object.is equality

                        // - Expected
                        // + Received

                        // - 2048
                        // + 1024
                        const r = dag((z) => [z('a', ['b', 'c', 'd'])]).nowarn().raw
                        expect(r.b).toBe(r.c)
                        expect(r.c).toBe(r.d)
                })

                it('complete DAG preserves uniform stride', () => {
                        const r = dag((z) => [z('a', ['b', 'c', 'd']), z('b', ['c', 'd']), z('c', 'd')]).nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('disconnected pair edges have independent stride', () => {
                        // AssertionError: expected 2048 to be 1024 // Object.is equality

                        // - Expected
                        // + Received

                        // - 1024
                        // + 2048
                        const r = dag((z) => [z('a', 'd'), z('b', 'c')]).nowarn().raw
                        expect(r.d - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                })
        })

        describe('cycle detection', () => {
                it('direct cycle: z("a","b"), z("b","a") throws', () => {
                        expect(() => index((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                })

                it('four-node cycle: a < b < c < d < a throws', () => {
                        expect(() => index((z) => [z('a', 'b', 'c', 'd'), z('d', 'a')])).toThrow('cycle')
                })

                it('triangle within four nodes throws', () => {
                        expect(() => index((z) => [z('a', 'b', 'c'), z('c', 'a')])).toThrow('cycle')
                })
        })
})
