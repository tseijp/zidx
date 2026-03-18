import { describe, expect, it } from 'vitest'
import { dag, index, S } from './utils'

describe('TaggedPairs recursion', () => {
        describe('simple tagged children', () => {
                it('tagged child: chain=z("b","c"); z("a",[chain]) => a < b < c', () => {
                        dag((z) => {
                                const chain = z('b', 'c')
                                return [z('a', [chain])]
                        })
                                .relative('a', 'b', 'c')
                                .nowarn()
                })

                it('tagged chain reuse: chain=z("b","c","d"); z("a",[chain,"e"])', () => {
                        dag((z) => {
                                const chain = z('b', 'c', 'd')
                                return [z('a', [chain, 'e'])]
                        })
                                .absolute(['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e'])
                                .nowarn()
                })

                it('two tagged subtrees under one parent', () => {
                        dag((z) => {
                                const left = z('b', 'c')
                                const right = z('d', 'e')
                                return [z('a', [left, right])]
                        })
                                .absolute(['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e'])
                                .nowarn()
                })

                it('three tagged subtrees under one parent', () => {
                        dag((z) => {
                                const t1 = z('b', 'c')
                                const t2 = z('d', 'e')
                                const t3 = z('f', 'g')
                                return [z('a', [t1, t2, t3])]
                        })
                                .absolute(['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e'], ['a', 'f'], ['f', 'g'])
                                .nowarn()
                })

                it('tagged + string siblings: z("a",[z("b","c"),"d","e"])', () => {
                        dag((z) => [z('a', [z('b', 'c'), 'd', 'e'])])
                                .absolute(['a', 'b'], ['b', 'c'], ['a', 'd'], ['a', 'e'])
                                .nowarn()
                })
        })

        describe('deep nesting', () => {
                it('deep nesting 2 levels: z("a",[z("b",[z("c","d")])])', () => {
                        dag((z) => [z('a', [z('b', [z('c', 'd')])])])
                                .relative('a', 'b', 'c', 'd')
                                .nowarn()
                })

                it('deep nesting 3 levels: z("a",[z("b",[z("c",[z("d","e")])])])', () => {
                        dag((z) => [z('a', [z('b', [z('c', [z('d', 'e')])])])])
                                .relative('a', 'b', 'c', 'd', 'e')
                                .nowarn()
                })
        })

        describe('chain then tagged branch', () => {
                it('chain + tagged branch ordering', () => {
                        const r = dag((z) => [z('a', 'b', 'c'), z('b', [z('d', ['e', 'f']), 'g'])])
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'], ['d', 'e'], ['d', 'f'], ['b', 'g'])
                                .nowarn().raw
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.b).toBeLessThan(r.d)
                        expect(r.d).toBeLessThan(r.e)
                        expect(r.d).toBeLessThan(r.f)
                })

                it.skip('chain + tagged branch: f < g and g < c', () => {
                        const r = dag((z) => [z('a', 'b', 'c'), z('b', [z('d', ['e', 'f']), 'g'])]).raw
                        expect(r.f).toBeLessThan(r.g)
                        expect(r.g).toBeLessThan(r.c)
                })
        })

        describe('multiple parents sharing tagged child', () => {
                it('shared tagged child between two parents', () => {
                        dag((z) => {
                                const shared = z('c', 'd')
                                return [z('a', [shared]), z('b', [shared])]
                        })
                                .absolute(['a', 'c'], ['b', 'c'], ['c', 'd'])
                                .nowarn()
                })
        })

        describe('tagged pairs with array children', () => {
                it('z("a",[z("b",["c","d"])])', () => {
                        dag((z) => [z('a', [z('b', ['c', 'd'])])])
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'])
                                .nowarn()
                })
        })

        describe('reusing index result as tagged child', () => {
                it.skip('branch=index(z=>[z("b","c")]); index(z=>[z("a",[branch])])', () => {
                        const branch = index((z) => [z('b', 'c')])
                        const res = index((z) => [z('a', [branch as any])])
                        expect(res.a).toBeLessThan(res.b)
                        expect(res.b).toBeLessThan(res.c)
                })
        })

        describe('mixed tagged and string children', () => {
                it('z("a",["b","c"]), z("b",[z("d","e"),"f"])', () => {
                        dag((z) => [z('a', ['b', 'c']), z('b', [z('d', 'e'), 'f'])])
                                .absolute(['a', 'b'], ['a', 'c'], ['b', 'd'], ['d', 'e'], ['b', 'f'])
                                .nowarn()
                })
        })

        describe('two-level fan', () => {
                it('z("a",[z("b",["c","d"]),z("e",["f","g"])])', () => {
                        dag((z) => [z('a', [z('b', ['c', 'd']), z('e', ['f', 'g'])])])
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'], ['a', 'e'], ['e', 'f'], ['e', 'g'])
                                .nowarn()
                })
        })

        describe('sequential tagged reuse', () => {
                it('a=z("a","b"), b=z("b","c") combined ordering', () => {
                        dag((z) => {
                                const ab = z('a', 'b')
                                const bc = z('b', 'c')
                                return [ab, bc]
                        })
                                .relative('a', 'b', 'c')
                                .nowarn()
                })
        })

        describe('stride uniformity with tagged pairs', () => {
                it('tagged chain preserves uniform stride', () => {
                        const r = dag((z) => [z('a', [z('b', [z('c', 'd')])])])
                                .relative('a', 'b', 'c', 'd')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('two subtrees maintain ordering from parent', () => {
                        const r = dag((z) => {
                                const left = z('b', 'c')
                                const right = z('d', 'e')
                                return [z('a', [left, right])]
                        }).nowarn().raw
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.b).toBeLessThan(r.c)
                        expect(r.a).toBeLessThan(r.d)
                        expect(r.d).toBeLessThan(r.e)
                })
        })
})
