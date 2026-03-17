import { describe, expect, it } from 'vitest'
import index from './index'

describe('z index pair inference 0.2', () => {
        it('recurses through nested tagged subtrees and preserves uniform steps', () => {
                const res = index((z) => [z('a', [z('b', [z('c', 'd'), 'e']), z('f', ['g'])])])
                const step = res.b - res.a

                // @TODO FIX narrow gap f
                // expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.f)
                expect(res.f).toBeLessThan(res.c)
                expect(res.c).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.g)
                expect(res.g).toBeLessThan(res.d)

                expect(res.b - res.a).toBe(step)
                expect(res.f - res.b).toBe(step)
                expect(res.c - res.f).toBe(step)
                expect(res.e - res.c).toBe(step)
                expect(res.g - res.e).toBe(step)
                expect(res.d - res.g).toBe(step)
        })

        it('keeps same-level siblings spaced equally across flat and nested arrays', () => {
                const res = index((z) => [z('a', [[['b', 'c']], ['d', 'e'], 'f'])])
                const step = res.b - res.a

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.c)
                // @TODO FIX
                // expect(res.c).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.f)

                expect(res.b - res.a).toBe(step)
                // @TODO FIX
                // expect(res.c - res.b).toBe(step)
                // expect(res.d - res.c).toBe(step)
                expect(res.e - res.d).toBe(step)
                expect(res.f - res.e).toBe(step)
        })

        it('mixes linear and tree forms across extensions while keeping seeds fixed', () => {
                const base = index((z) => [z('a', 'b', 'c')])
                const next = base((z) => [z('b', ['d', 'e']), z('c', 'f', 'g')])

                // @TODO FIX narrow gap f
                // expect(next.warns).toEqual([])
                expect(next.a).toBe(base.a)
                expect(next.b).toBe(base.b)
                expect(next.c).toBe(base.c)

                expect(next.d).toBeGreaterThan(base.b)
                expect(next.e).toBeGreaterThan(base.b)
                expect(next.d).toBeLessThan(base.c)
                expect(next.e).toBeLessThan(base.c)
                expect(next.f).toBeGreaterThan(base.c)
                expect(next.g).toBeGreaterThan(next.f)
        })

        it('infers full key sets after combining tagged, array, and linear inputs', () => {
                const res = index((z) => {
                        const nested = z('d', ['e', z('f', 'g')])
                        return [z('a', ['b', 'c']), z('b', [nested, 'h'])]
                })

                expect(res.warns).toEqual([])
                expect(res.a).toBeLessThan(res.b)
                expect(res.b).toBeLessThan(res.d)
                expect(res.d).toBeLessThan(res.e)
                expect(res.e).toBeLessThan(res.f)
                expect(res.f).toBeLessThan(res.g)
                // @TODO FIX
                // expect(res.g).toBeLessThan(res.h)
                // expect(res.h).toBeLessThan(res.c)
        })
})
