import { describe, expect, it } from 'vitest'
import { absolute, relative, S } from './utils'
import { index } from './index'

describe('Edge recursion', () => {
        describe('simple tagged children', () => {
                it('tagged child: chain=z("b","c"); z("a",[chain]) => a < b < c', () => {
                        const r = index((z) => z('a', [z('b', 'c')]))
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                })

                it('tagged chain reuse: chain=z("b","c","d"); z("a",[chain,"e"])', () => {
                        const r = index((z) => z('a', [z('b', 'c', 'd'), 'e']))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['c', 'd'], ['a', 'e']) // @ts-expect-error
                        r._
                })

                it('two tagged subtrees under one parent', () => {
                        const r = index((z) => z('a', [z('b', 'c'), z('d', 'e')]))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e']) // @ts-expect-error
                        r._
                })

                it('three tagged subtrees under one parent', () => {
                        const r = index((z) => z('a', [z('b', 'c'), z('d', 'e'), z('f', 'g')]))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['a', 'd'], ['d', 'e'], ['a', 'f'], ['f', 'g']) // @ts-expect-error
                        r._
                })

                it('tagged + string siblings: z("a",[z("b","c"),"d","e"])', () => {
                        const r = index((z) => z('a', [z('b', 'c'), 'd', 'e']))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['a', 'd'], ['a', 'e']) // @ts-expect-error
                        r._
                })
        })

        describe('deep nesting', () => {
                it('deep nesting 2 levels: z("a",[z("b",[z("c","d")])])', () => {
                        const r = index((z) => z('a', [z('b', [z('c', 'd')])]))
                        relative(r, 'a', 'b', 'c', 'd') // @ts-expect-error
                        r._
                })

                it('deep nesting 3 levels: z("a",[z("b",[z("c",[z("d","e")])])])', () => {
                        const r = index((z) => z('a', [z('b', [z('c', [z('d', 'e')])])]))
                        relative(r, 'a', 'b', 'c', 'd', 'e') // @ts-expect-error
                        r._
                })
        })

        describe('chain then tagged branch', () => {
                it('chain + tagged branch ordering', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('b', [z('d', ['e', 'f']), 'g'])])
                        absolute(r, ['a', 'b'], ['b', 'c'], ['b', 'd'], ['d', 'e'], ['d', 'f'], ['b', 'g']) // @ts-expect-error
                        r._
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.b).toBeLessThan(r.d)
                        expect(r.d).toBeLessThan(r.e)
                        expect(r.d).toBeLessThan(r.f)
                })

                it('chain + tagged branch: f < g and g < c', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('b', [z('d', ['e', 'f']), 'g'])]) // @ts-expect-error
                        r._
                        expect(r.g).toBeLessThan(r.f)
                        expect(r.g).toBe(r.c)
                })
        })

        describe('multiple parents sharing tagged child', () => {
                it('shared tagged child between two parents', () => {
                        const r = index((z) => {
                                const shared = z('c', 'd')
                                return [z('a', [shared]), z('b', [shared])]
                        })
                        absolute(r, ['a', 'c'], ['b', 'c'], ['c', 'd']) // @ts-expect-error
                        r._
                })
        })

        describe('tagged pairs with array children', () => {
                it('z("a",[z("b",["c","d"])])', () => {
                        const r = index((z) => z('a', [z('b', ['c', 'd'])]))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['b', 'd']) // @ts-expect-error
                        r._
                })
        })

        describe('reusing index result as tagged child', () => {
                it('branch=index(z=>[z("b","c")]); index(z=>[z("a",[branch])])', () => {
                        const branch = index((z) => [z('b', 'c')])
                        const r = index((z) => [z('a', [branch])]) // @ts-expect-error
                        r._
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.b).toBeLessThan(r.c)
                })
        })

        describe('mixed tagged and string children', () => {
                it('z("a",["b","c"]), z("b",[z("d","e"),"f"])', () => {
                        const r = index((z) => [z('a', ['b', 'c']), z('b', [z('d', 'e'), 'f'])])
                        absolute(r, ['a', 'b'], ['a', 'c'], ['b', 'd'], ['d', 'e'], ['b', 'f']) // @ts-expect-error
                        r._
                })
        })

        describe('two-level fan', () => {
                it('z("a",[z("b",["c","d"]),z("e",["f","g"])])', () => {
                        const r = index((z) => z('a', [z('b', ['c', 'd']), z('e', ['f', 'g'])]))
                        absolute(r, ['a', 'b'], ['b', 'c'], ['b', 'd'], ['a', 'e'], ['e', 'f'], ['e', 'g']) // @ts-expect-error
                        r._
                })
        })

        describe('sequential tagged reuse', () => {
                it('a=z("a","b"), b=z("b","c") combined ordering', () => {
                        const r = index((z) => [z('a', 'b'), z('b', 'c')])
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                })
        })

        describe('stride uniformity with tagged pairs', () => {
                it('tagged chain preserves uniform stride', () => {
                        const r = index((z) => z('a', [z('b', [z('c', 'd')])]))
                        relative(r, 'a', 'b', 'c', 'd') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('two subtrees maintain ordering from parent', () => {
                        const r = index((z) => z('a', [z('b', 'c'), z('d', 'e')])) // @ts-expect-error
                        r._
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.b).toBeLessThan(r.c)
                        expect(r.a).toBeLessThan(r.d)
                        expect(r.d).toBeLessThan(r.e)
                })
        })
})
