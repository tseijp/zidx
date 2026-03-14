import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const mid = (lo: number, up: number) => lo + ((up - lo) >> 1)

describe('zidx ext/override 2.1', () => {
        it('shrinks gaps with repeated midpoint insertions', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('a', 'c', 'b')])
                const second = first((z) => [z('a', 'd', 'c')])
                const third = second((z) => [z('d', 'e', 'c')])
                const fourth = third((z) => [z('c', 'f', 'b')])

                expect(first.a).toBe(base.a)
                expect(first.b).toBe(base.b)
                expect(second.a).toBe(base.a)
                expect(third.b).toBe(base.b)
                expect(fourth.a).toBe(base.a)

                expect(first.c).toBe(base.a + (step >> 1))
                expect(second.d).toBe(base.a + (step >> 2))
                expect(third.e).toBe(base.a + ((step * 3) >> 3))
                expect(fourth.f).toBe(base.a + ((step * 3) >> 2))

                expect(second.d).toBeGreaterThan(base.a)
                expect(second.d).toBeLessThan(first.c)
                expect(third.e).toBeGreaterThan(second.d)
                expect(third.e).toBeLessThan(first.c)
                expect(fourth.f).toBeGreaterThan(first.c)
                expect(fourth.f).toBeLessThan(base.b)
        })

        it('keeps earlier insertions stable while gaps keep shrinking', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('a', 'c', 'b')])
                const second = first((z) => [z('a', 'd', 'c')])
                const third = second((z) => [z('a', 'e', 'd')])

                expect(first.c).toBe(base.a + (step >> 1))
                expect(second.c).toBe(first.c)
                expect(third.c).toBe(first.c)

                expect(second.d).toBe(base.a + (step >> 2))
                expect(third.d).toBe(second.d)

                expect(third.e).toBe(base.a + (step >> 3))
                expect(third.e).toBeGreaterThan(base.a)
                expect(third.e).toBeLessThan(third.d)
        })

        it('supports incremental insertion on both sides of a midpoint', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('a', 'c', 'b')])
                const left = first((z) => [z('a', 'd', 'c')])
                const right = left((z) => [z('c', 'e', 'b')])
                const inner = right((z) => [z('d', 'f', 'c')])

                expect(first.c).toBe(base.a + (step >> 1))
                expect(left.d).toBe(base.a + (step >> 2))
                expect(right.e).toBe(base.a + ((step * 3) >> 2))
                expect(inner.f).toBe(mid(left.d + 1, first.c - 1))

                expect(inner.a).toBe(base.a)
                expect(inner.b).toBe(base.b)
                expect(inner.c).toBe(first.c)
                expect(inner.d).toBe(left.d)
        })

        it('preserves ordering while insertions pack tighter', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('a', 'c', 'b')])
                const second = first((z) => [z('a', 'd', 'c')])
                const third = second((z) => [z('d', 'e', 'c')])

                expect(second.d).toBe(base.a + (step >> 2))
                expect(third.e).toBe(base.a + ((step * 3) >> 3))

                expect(base.a).toBeLessThan(second.d)
                expect(second.d).toBeLessThan(third.e)
                expect(third.e).toBeLessThan(first.c)
                expect(first.c).toBeLessThan(base.b)
        })

        it('shrinks gaps on the right while keeping left seeds fixed', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('a', 'c', 'b')])
                const second = first((z) => [z('c', 'd', 'b')])
                const third = second((z) => [z('d', 'e', 'b')])

                expect(first.c).toBe(base.a + (step >> 1))
                expect(second.d).toBe(base.a + ((step * 3) >> 2))
                expect(third.e).toBe(base.a + ((step * 7) >> 3))

                expect(third.a).toBe(base.a)
                expect(third.b).toBe(base.b)
                expect(third.c).toBe(first.c)
        })
})
