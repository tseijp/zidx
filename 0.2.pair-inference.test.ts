import { describe, expect, expectTypeOf, it } from 'vitest'
import { index } from './utils'

describe('type inference and edge cases', () => {
        describe('expectTypeOf linear chain', () => {
                it('linear chain has all keys as number', () => {
                        const r = index((z) => z('a', 'b', 'c'))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                })

                it('single pair z("a","b") type has a:number, b:number', () => {
                        const r = index((z) => z('a', 'b'))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.warns).toEqualTypeOf<string[]>()
                })
        })

        describe('expectTypeOf array children', () => {
                it('array children has all keys as number', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd']))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                })

                it('reversed array children type inference', () => {
                        const r = index((z) => z('a', ['d', 'c', 'b']))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                })
        })

        describe('expectTypeOf tagged pairs', () => {
                it('tagged pairs propagates all keys', () => {
                        const r = index((z) => z('a', [z('b', 'c')]))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                })

                it('mixed inputs combines all keys', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('b', ['d', 'e'])])
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                        expectTypeOf(r.e).toBeNumber()
                })
        })

        describe('expectTypeOf extension', () => {
                it('extension preserves + adds keys', () => {
                        const base = index((z) => z('a', 'b'))
                        const ext = base((z) => z('b', 'c', 'd'))
                        // @ts-expect-error
                        expectTypeOf(ext._).toBeNumber()
                        expectTypeOf(ext.a).toBeNumber()
                        expectTypeOf(ext.b).toBeNumber()
                        expectTypeOf(ext.c).toBeNumber()
                        expectTypeOf(ext.d).toBeNumber()
                })

                it('extension type combines base + new keys', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => [z('c', 'd'), z('b', ['e', 'f'])])
                        // @ts-expect-error
                        expectTypeOf(next._).toBeNumber()
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
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                        expectTypeOf(r.e).toBeNumber()
                        expectTypeOf(r.f).toBeNumber()
                        expectTypeOf(r.g).toBeNumber()
                        expectTypeOf(r.h).toBeNumber()
                })
        })

        describe('deep nested tagged type inference', () => {
                it('z("a",[z("b",[z("c","d"),"e"]),z("f",["g"])]) all keys typed', () => {
                        const r = index((z) => z('a', [z('b', [z('c', 'd'), 'e']), z('f', ['g'])]))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                        expectTypeOf(r.e).toBeNumber()
                        expectTypeOf(r.f).toBeNumber()
                        expectTypeOf(r.g).toBeNumber()
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.a).toBeLessThan(r.f)
                        expect(r.b).toBeLessThan(r.c)
                        expect(r.c).toBeLessThan(r.d)
                        expect(r.b).toBeLessThan(r.e)
                })

                it('deep nested tagged: warns is empty (narrow gap f)', () => {
                        const r = index((z) => z('a', [z('b', [z('c', 'd'), 'e']), z('f', ['g'])]))
                        expect(r.warns).toEqual([])
                })
        })

        describe('flat + nested arrays', () => {
                it('z("a",[["b","c"],["d","e"],"f"]) all above a', () => {
                        const r = index((z) => z('a', [['b', 'c'], ['d', 'e'], 'f']))
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.a).toBeLessThan(r.c)
                        expect(r.a).toBeLessThan(r.d)
                        expect(r.a).toBeLessThan(r.e)
                        expect(r.a).toBeLessThan(r.f)
                })

                it('flat + nested arrays: c < d ordering', () => {
                        const r = index((z) => z('a', [['b', 'c'], ['d', 'e'], 'f']))
                        expect(r.c).toBeLessThan(r.d)
                })
        })

        describe('extension seeds preserved', () => {
                it('base values survive extension', () => {
                        const base = index((z) => z('a', 'b', 'c'))
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
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => [z('b', ['d', 'e']), z('c', 'f', 'g')])
                        expect(next.warns).toEqual([])
                })
        })

        describe('combined tagged + array + linear key inference', () => {
                it('all keys present and basic ordering', () => {
                        const r = index((z) => [z('a', ['b', 'c']), z('b', [z('d', ['e', z('f', 'g')]), 'h'])])
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.a).toBeNumber()
                        expectTypeOf(r.b).toBeNumber()
                        expectTypeOf(r.c).toBeNumber()
                        expectTypeOf(r.d).toBeNumber()
                        expectTypeOf(r.e).toBeNumber()
                        expectTypeOf(r.f).toBeNumber()
                        expectTypeOf(r.g).toBeNumber()
                        expectTypeOf(r.h).toBeNumber()
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.a).toBeLessThan(r.c)
                        expect(r.b).toBeLessThan(r.d)
                        expect(r.d).toBeLessThan(r.e)
                        expect(r.d).toBeLessThan(r.f)
                        expect(r.f).toBeLessThan(r.g)
                })

                it('combined tagged + array + linear: g < h and h < c', () => {
                        const r = index((z) => [z('a', ['b', 'c']), z('b', [z('d', ['e', z('f', 'g')]), 'h'])])
                        expect(r.h).toBeLessThan(r.g)
                        expect(r.c).toBeLessThan(r.h)
                })
        })

        describe('edge cases', () => {
                it('duplicate declarations are idempotent', () => {
                        const single = index((z) => z('a', 'b'))
                        const double = index((z) => [z('a', 'b'), z('a', 'b')])
                        expect(double.a).toBe(single.a)
                        expect(double.b).toBe(single.b)
                })

                it('warns array exists on result', () => {
                        const r = index((z) => z('a', 'b'))
                        expect(Array.isArray(r.warns)).toBe(true)
                })

                it('empty warns for simple valid inputs', () => {
                        const r = index((z) => z('a', 'b', 'c'))
                        expect(r.warns).toEqual([])
                })

                it('complex nested: multiple layers all surface in type', () => {
                        const r = index((z) => z('root', [z('l1', [z('l2a', 'leaf1'), 'leaf2']), z('r1', ['leaf3', 'leaf4'])]))
                        // @ts-expect-error
                        r._
                        expectTypeOf(r.root).toBeNumber()
                        expectTypeOf(r.l1).toBeNumber()
                        expectTypeOf(r.l2a).toBeNumber()
                        expectTypeOf(r.leaf1).toBeNumber()
                        expectTypeOf(r.leaf2).toBeNumber()
                        expectTypeOf(r.r1).toBeNumber()
                        expectTypeOf(r.leaf3).toBeNumber()
                        expectTypeOf(r.leaf4).toBeNumber()
                        expect(r.root).toBeLessThan(r.l1)
                        expect(r.root).toBeLessThan(r.r1)
                        expect(r.l1).toBeLessThan(r.l2a)
                        expect(r.l2a).toBeLessThan(r.leaf1)
                })
        })
})
