import { describe, expect, expectTypeOf, it } from 'vitest'
import index from './index'

describe('z index pair basics 0.0', () => {
        it('orders linear string chains with constant stride', () => {
                const res = index((z) => [z('a', 'b', 'c', 'd')])
                const stride = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.d)
                expect(res.c - res.b).toBe(stride)
                expect(res.d - res.c).toBe(stride)
        })

        it('connects a parent to array children and keeps sibling spacing uniform', () => {
                const res = index((z) => [z('a', ['b', 'c', 'd'])])
                const stride = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.b).toBeGreaterThan(res.a)
                expect(res.c).toBeGreaterThan(res.a)
                expect(res.d).toBeGreaterThan(res.a)
                expect(res.b - res.a).toBe(stride)
                expect(res.c - res.b).toBe(stride)
                expect(res.d - res.c).toBe(stride)
        })

        it('mixes linear and tree declarations in one build while keeping stride stable', () => {
                const res = index((z) => [z('a', 'b', 'c'), z('b', ['d', 'e'])])
                const stride = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.e)
                expect(res.c - res.b).toBe(stride)
                expect(res.d - res.c).toBe(stride)
                expect(res.e - res.d).toBe(stride)
        })

        it('flattens mixed nested arrays into consistent ranks above the parent', () => {
                const res = index((z) => [z('a', ['b', ['c', 'd'], 'e'])])
                const stride = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.b).toBeGreaterThan(res.a)
                expect(res.c).toBeGreaterThan(res.a)
                expect(res.d).toBeGreaterThan(res.a)
                expect(res.e).toBeGreaterThan(res.a)
                expect(res.c - res.b).toBe(stride)
                expect(res.d - res.c).toBe(stride)
                expect(res.e - res.d).toBe(stride)
        })

        it('infers composite keys from linear and tree inputs together', () => {
                const res = index((z) => [z('a', 'b', 'c'), z('c', ['d', 'e'])])

                expect(res.warns).toEqual([])
                expect(res.e).toBeGreaterThan(res.d)
                expect(res.d).toBeGreaterThan(res.c)
                expect(res.c).toBeGreaterThan(res.b)
                expectTypeOf(res).toMatchTypeOf<{ a: number; b: number; c: number; d: number; e: number; warns: string[] }>()
        })
})
