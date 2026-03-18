import { describe, expect, expectTypeOf, it } from 'vitest'
import { index } from './utils'

describe('type inference and edge cases', () => {
        describe('expectTypeOf linear chain', () => {
                it('linear chain has all keys as number', () => {
                        const res = index((z) => [z('a', 'b', 'c')])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                })

                it('single pair z("a","b") type has a:number, b:number', () => {
                        const res = index((z) => [z('a', 'b')])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.warns).toEqualTypeOf<string[]>()
                })
        })

        describe('expectTypeOf array children', () => {
                it('array children has all keys as number', () => {
                        const res = index((z) => [z('a', ['b', 'c', 'd'])])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                })

                it('reversed array children type inference', () => {
                        const res = index((z) => [z('a', ['d', 'c', 'b'])])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                })
        })

        describe('expectTypeOf tagged pairs', () => {
                it('tagged pairs propagates all keys', () => {
                        const res = index((z) => {
                                const chain = z('b', 'c')
                                return [z('a', [chain])]
                        })
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                })

                it('mixed inputs combines all keys', () => {
                        const res = index((z) => [z('a', 'b', 'c'), z('b', ['d', 'e'])])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                        expectTypeOf(res.e).toBeNumber()
                })
        })

        describe('expectTypeOf extension', () => {
                it('extension preserves + adds keys', () => {
                        const base = index((z) => [z('a', 'b')])
                        const ext = base((z) => [z('b', 'c', 'd')])
                        expectTypeOf(ext.a).toBeNumber()
                        expectTypeOf(ext.b).toBeNumber()
                        expectTypeOf(ext.c).toBeNumber()
                        expectTypeOf(ext.d).toBeNumber()
                })

                it('extension type combines base + new keys', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('c', 'd'), z('b', ['e', 'f'])])
                        expectTypeOf(next.a).toBeNumber()
                        expectTypeOf(next.b).toBeNumber()
                        expectTypeOf(next.c).toBeNumber()
                        expectTypeOf(next.d).toBeNumber()
                        expectTypeOf(next.e).toBeNumber()
                        expectTypeOf(next.f).toBeNumber()
                })
        })

        describe('large key set', () => {
                it('8+ keys all present in type', () => {
                        const res = index((z) => [z('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h')])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                        expectTypeOf(res.e).toBeNumber()
                        expectTypeOf(res.f).toBeNumber()
                        expectTypeOf(res.g).toBeNumber()
                        expectTypeOf(res.h).toBeNumber()
                })
        })

        describe('deep nested tagged type inference', () => {
                it('z("a",[z("b",[z("c","d"),"e"]),z("f",["g"])]) all keys typed', () => {
                        const res = index((z) => [z('a', [z('b', [z('c', 'd'), 'e']), z('f', ['g'])])])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                        expectTypeOf(res.e).toBeNumber()
                        expectTypeOf(res.f).toBeNumber()
                        expectTypeOf(res.g).toBeNumber()
                        expect(res.a).toBeLessThan(res.b)
                        expect(res.a).toBeLessThan(res.f)
                        expect(res.b).toBeLessThan(res.c)
                        expect(res.c).toBeLessThan(res.d)
                        expect(res.b).toBeLessThan(res.e)
                })

                it('deep nested tagged: warns is empty (narrow gap f)', () => {
                        const res = index((z) => [z('a', [z('b', [z('c', 'd'), 'e']), z('f', ['g'])])])
                        expect(res.warns).toEqual([])
                })
        })

        describe('flat + nested arrays', () => {
                it('z("a",[[["b","c"]],["d","e"],"f"]) all above a', () => {
                        const res = index((z) => [z('a', [[['b', 'c']], ['d', 'e'], 'f'])])
                        expect(res.a).toBeLessThan(res.b)
                        expect(res.a).toBeLessThan(res.c)
                        expect(res.a).toBeLessThan(res.d)
                        expect(res.a).toBeLessThan(res.e)
                        expect(res.a).toBeLessThan(res.f)
                })

                it('flat + nested arrays: c < d ordering', () => {
                        // AssertionError: expected 3072 to be less than 2048
                        const res = index((z) => [z('a', [[['b', 'c']], ['d', 'e'], 'f'])])
                        expect(res.c).toBeLessThan(res.d)
                })
        })

        describe('extension seeds preserved', () => {
                it('base values survive extension', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('b', ['d', 'e']), z('c', 'f', 'g')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.b).toBeLessThan(next.d)
                        expect(next.b).toBeLessThan(next.e)
                        expect(next.c).toBeLessThan(next.f)
                        expect(next.f).toBeLessThan(next.g)
                })

                it('extension seeds preserved: warns is empty (narrow gap)', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('b', ['d', 'e']), z('c', 'f', 'g')])
                        expect(next.warns).toEqual([])
                })
        })

        describe('combined tagged + array + linear key inference', () => {
                it('all keys present and basic ordering', () => {
                        const res = index((z) => [z('a', ['b', 'c']), z('b', [z('d', ['e', z('f', 'g')]), 'h'])])
                        expectTypeOf(res.a).toBeNumber()
                        expectTypeOf(res.b).toBeNumber()
                        expectTypeOf(res.c).toBeNumber()
                        expectTypeOf(res.d).toBeNumber()
                        expectTypeOf(res.e).toBeNumber()
                        expectTypeOf(res.f).toBeNumber()
                        expectTypeOf(res.g).toBeNumber()
                        expectTypeOf(res.h).toBeNumber()
                        expect(res.a).toBeLessThan(res.b)
                        expect(res.a).toBeLessThan(res.c)
                        expect(res.b).toBeLessThan(res.d)
                        expect(res.d).toBeLessThan(res.e)
                        expect(res.d).toBeLessThan(res.f)
                        expect(res.f).toBeLessThan(res.g)
                })

                it('combined tagged + array + linear: g < h and h < c', () => {
                        // AssertionError: expected 5120 to be less than 3072
                        const res = index((z) => [z('a', ['b', 'c']), z('b', [z('d', ['e', z('f', 'g')]), 'h'])])
                        expect(res.g).toBeLessThan(res.h)
                        expect(res.h).toBeLessThan(res.c)
                })
        })

        describe('edge cases', () => {
                it('duplicate declarations are idempotent', () => {
                        const single = index((z) => [z('a', 'b')])
                        const double = index((z) => [z('a', 'b'), z('a', 'b')])
                        expect(double.a).toBe(single.a)
                        expect(double.b).toBe(single.b)
                })

                it('warns array exists on result', () => {
                        const res = index((z) => [z('a', 'b')])
                        expect(Array.isArray(res.warns)).toBe(true)
                })

                it('empty warns for simple valid inputs', () => {
                        const res = index((z) => [z('a', 'b', 'c')])
                        expect(res.warns).toEqual([])
                })

                it('complex nested: multiple layers all surface in type', () => {
                        const res = index((z) => [z('root', [z('l1', [z('l2a', 'leaf1'), 'leaf2']), z('r1', ['leaf3', 'leaf4'])])])
                        expectTypeOf(res.root).toBeNumber()
                        expectTypeOf(res.l1).toBeNumber()
                        expectTypeOf(res.l2a).toBeNumber()
                        expectTypeOf(res.leaf1).toBeNumber()
                        expectTypeOf(res.leaf2).toBeNumber()
                        expectTypeOf(res.r1).toBeNumber()
                        expectTypeOf(res.leaf3).toBeNumber()
                        expectTypeOf(res.leaf4).toBeNumber()
                        expect(res.root).toBeLessThan(res.l1)
                        expect(res.root).toBeLessThan(res.r1)
                        expect(res.l1).toBeLessThan(res.l2a)
                        expect(res.l2a).toBeLessThan(res.leaf1)
                })
        })
})
