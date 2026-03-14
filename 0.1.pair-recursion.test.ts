import { describe, expect, expectTypeOf, it } from 'vitest'
import { zIndex } from './index'

describe('zidx pair recursion 0.1', () => {
        it('links a parent to the root of a nested TaggedPairs chain', () => {
                const res = zIndex((z) => {
                        const chain = z('b', 'c', 'd')
                        return [z('a', [chain, 'e'])]
                })
                const step = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.d)

                expect(res.b - res.a).toBe(step)
                expect(res.e - res.b).toBe(step)
                expect(res.c - res.e).toBe(step)
                expect(res.d - res.c).toBe(step)

                expectTypeOf(res).toMatchTypeOf<{
                        a: number
                        b: number
                        c: number
                        d: number
                        e: number
                        warns: string[]
                }>()
        })

        it('keeps sibling spacing equal when multiple tagged subtrees share a parent', () => {
                const res = zIndex((z) => {
                        const left = z('b', 'c')
                        const right = z('d', 'e')
                        return [z('a', [left, right])]
                })
                const step = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.e)

                expect(res.b - res.a).toBe(step)
                expect(res.d - res.b).toBe(step)
                expect(res.c - res.d).toBe(step)
                expect(res.e - res.c).toBe(step)
        })

        it('mixes a top-level chain with sibling arrays and keeps uniform gaps', () => {
                const res = zIndex((z) => [z('a', 'b', 'c'), z('a', ['d', 'e']), z('c', ['f', 'g'])])
                const step = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.f)
                expect(res.f).toBeLessThan(res.g)

                expect(res.b - res.a).toBe(step)
                expect(res.d - res.b).toBe(step)
                expect(res.e - res.d).toBe(step)
                expect(res.c - res.e).toBe(step)
                expect(res.f - res.c).toBe(step)
                expect(res.g - res.f).toBe(step)
        })

        it('infers keys across combined linear, array, and nested tagged inputs', () => {
                const res = zIndex((z) => {
                        const branch = z('d', ['e', 'f'])
                        return [z('a', 'b', 'c'), z('b', [branch, 'g'])]
                })

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.f)
                expect(res.f).toBeLessThan(res.g)
                expect(res.g).toBeLessThan(res.c)

                expectTypeOf(res).toMatchTypeOf<{
                        a: number
                        b: number
                        c: number
                        d: number
                        e: number
                        f: number
                        g: number
                        warns: string[]
                }>()
        })
})
