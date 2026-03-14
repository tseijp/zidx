import { describe, expect, it } from 'vitest'
import { zIndex } from './index'

const mid = (lo: number, up: number) => lo + ((up - lo) >> 1)

describe('zidx ext/override 2.2', () => {
        it('splits large exterior ranges around seeded ends', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const next = base((z) => [z('d', 'a'), z('b', 'e')])

                expect(next.a).toBe(base.a)
                expect(next.b).toBe(base.b)

                expect(next.d).toBe(mid(base.a - step, base.a - 1))
                expect(next.e).toBe(mid(base.b + 1, base.b + step))

                expect(next.d).toBeLessThan(base.a)
                expect(next.e).toBeGreaterThan(base.b)
        })

        it('clusters multiple inserts near the midpoint of a large gap', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a
                const center = base.a + (step >> 1)

                const next = base((z) => [z('a', 'c', 'd', 'e', 'b')])

                expect(next.a).toBe(base.a)
                expect(next.b).toBe(base.b)

                expect(next.d).toBe(center)
                expect(next.c).toBe(center - 1)
                expect(next.e).toBe(center + 1)

                expect(next.c).toBeGreaterThan(base.a)
                expect(next.e).toBeLessThan(base.b)
        })

        it('keeps seeds unchanged when mixing outer and inner inserts', () => {
                const base = zIndex((z) => [z('a', 'b')])
                const step = base.b - base.a

                const first = base((z) => [z('d', 'a'), z('a', 'c', 'b'), z('b', 'e')])
                const second = first((z) => [z('a', 'f', 'c')])

                expect(first.a).toBe(base.a)
                expect(first.b).toBe(base.b)
                expect(second.a).toBe(base.a)
                expect(second.b).toBe(base.b)

                expect(first.d).toBe(mid(base.a - step, base.a - 1))
                expect(first.e).toBe(mid(base.b + 1, base.b + step))
                expect(first.c).toBe(base.a + (step >> 1))

                expect(second.c).toBe(first.c)
                expect(second.d).toBe(first.d)
                expect(second.e).toBe(first.e)
                expect(second.f).toBe(mid(base.a + 1, first.c - 1))
        })

        it('packs multiple sibling gaps through chained overrides', () => {
                const base = zIndex((z) => [z('root', ['left', 'mid', 'edge', 'right'])])
                const step = base.mid - base.left

                const first = base((z) => [[z('left', 'l1', 'mid')], [z('mid', 'm1', 'edge')], [z('edge', 'e1', 'right')]])
                const second = first((z) => [[z('l1', 'l2', 'mid')], [z('m1', 'm2', 'edge')], [z('e1', 'e2', 'right')]])

                expect(second.root).toBe(base.root)
                expect(second.left).toBe(base.left)
                expect(second.mid).toBe(base.mid)
                expect(second.edge).toBe(base.edge)
                expect(second.right).toBe(base.right)

                expect(first.l1).toBe(base.left + (step >> 1))
                expect(first.m1).toBe(base.mid + (step >> 1))
                expect(first.e1).toBe(base.edge + (step >> 1))

                expect(second.l2).toBe(mid(first.l1 + 1, base.mid - 1))
                expect(second.m2).toBe(mid(first.m1 + 1, base.edge - 1))
                expect(second.e2).toBe(mid(first.e1 + 1, base.right - 1))

                expect(second.l2 - first.l1).toBeLessThan(step >> 1)
                expect(second.m2 - first.m1).toBeLessThan(step >> 1)
                expect(second.e2 - first.e1).toBeLessThan(step >> 1)

                expect(second.l2).toBeGreaterThan(base.left)
                expect(second.l2).toBeLessThan(base.mid)
                expect(second.m2).toBeGreaterThan(base.mid)
                expect(second.m2).toBeLessThan(base.edge)
                expect(second.e2).toBeGreaterThan(base.edge)
                expect(second.e2).toBeLessThan(base.right)
        })

        it('throws on cycles without relying on warnings', () => {
                expect(() => zIndex((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                const base = zIndex((z) => [z('a', 'b')])
                expect(() => base((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
        })
})
