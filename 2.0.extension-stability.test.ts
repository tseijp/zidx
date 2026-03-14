import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const mid = (lo: number, up: number) => lo + ((up - lo) >> 1)

describe('zidx ext/override 2.0', () => {
        it('keeps initial ranks stable across identical builds', () => {
                const first = zIndex((z) => [z('a', 'b', 'c', 'd')])
                const second = zIndex((z) => [z('a', 'b', 'c', 'd')])

                const step = first.b - first.a

                expect(step).toBeGreaterThan(0)
                expect(first.c - first.b).toBe(step)
                expect(first.d - first.c).toBe(step)

                expect(first.a).toBe(second.a)
                expect(first.b).toBe(second.b)
                expect(first.c).toBe(second.c)
                expect(first.d).toBe(second.d)
        })

        it('keeps seeded ranks unchanged after extension inserts', () => {
                const base = zIndex((z) => [z('a', 'b', 'c')])
                const step = base.b - base.a

                const next = base((z) => [z('a', 'd', 'b')])

                expect(next.a).toBe(base.a)
                expect(next.b).toBe(base.b)
                expect(next.c).toBe(base.c)

                expect(next.d).toBe(mid(base.a + 1, base.b - 1))
                expect(next.d).toBeGreaterThan(base.a)
                expect(next.d).toBeLessThan(base.b)
                expect(base.b - next.d).toBe(step / 2)
        })

        it('keeps seeds fixed across multiple extensions', () => {
                const base = zIndex((z) => [z('a', 'b', 'c')])
                const first = base((z) => [z('b', 'd', 'c')])
                const second = first((z) => [z('a', 'e', 'd')])

                expect(first.a).toBe(base.a)
                expect(first.b).toBe(base.b)
                expect(first.c).toBe(base.c)

                expect(second.a).toBe(base.a)
                expect(second.b).toBe(base.b)
                expect(second.c).toBe(base.c)

                expect(second.d).toBe(first.d)
                expect(second.e).toBeGreaterThan(base.a)
                expect(second.e).toBeLessThan(first.d)
        })

        it('densely fills a seeded gap via chained overrides without shifting seeds', () => {
                const base = zIndex((z) => [z('s0', 's1')])
                const step = base.s1 - base.s0

                const first = base((z) => [z('s0', 'x1', 's1')])
                const second = first((z) => [z('x1', 'x2', 's1')])
                const third = second((z) => [z('x2', 'x3', 's1')])
                const fourth = third((z) => [z('s0', 'x0', 'x1')])

                expect(fourth.s0).toBe(base.s0)
                expect(fourth.s1).toBe(base.s1)

                expect(fourth.s0).toBeLessThan(fourth.x0)
                expect(fourth.x0).toBeLessThan(fourth.x1)
                expect(fourth.x1).toBeLessThan(fourth.x2)
                expect(fourth.x2).toBeLessThan(fourth.x3)
                expect(fourth.x3).toBeLessThan(fourth.s1)

                expect(fourth.x1 - fourth.s0).toBeLessThan(step)
                expect(fourth.x2 - fourth.x1).toBeLessThan(step >> 1)
                expect(fourth.x3 - fourth.x2).toBeLessThan(step >> 1)
                expect(fourth.s1 - fourth.x3).toBeLessThan(step >> 1)
        })

        it('keeps equal sibling spacing when using nested tree shorthand and inserts between them', () => {
                const base = zIndex((z) => [z('root', ['s1', ['s2', 's3'], 's4'])])
                const step = base.s1 - base.root

                expect(base.s2 - base.s1).toBe(step)
                expect(base.s3 - base.s2).toBe(step)
                expect(base.s4 - base.s3).toBe(step)

                const ext = base((z) => [z('s1', 'p', 's2'), z('s2', 'q', 's3'), z('s3', 'r', 's4')])

                expect(ext.root).toBe(base.root)
                expect(ext.s1).toBe(base.s1)
                expect(ext.s2).toBe(base.s2)
                expect(ext.s3).toBe(base.s3)
                expect(ext.s4).toBe(base.s4)

                expect(ext.p).toBeGreaterThan(base.s1)
                expect(ext.p).toBeLessThan(base.s2)
                expect(ext.q).toBeGreaterThan(base.s2)
                expect(ext.q).toBeLessThan(base.s3)
                expect(ext.r).toBeGreaterThan(base.s3)
                expect(ext.r).toBeLessThan(base.s4)

                expect(base.s2 - ext.p).toBeLessThan(step)
                expect(base.s3 - ext.q).toBeLessThan(step)
                expect(base.s4 - ext.r).toBeLessThan(step)
        })
})
