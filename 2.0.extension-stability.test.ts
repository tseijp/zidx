import { describe, expect, it } from 'vitest'
import { index, S } from './utils'

describe('extension seed stability', () => {
        describe('identical builds', () => {
                it('two identical builds produce identical ranks', () => {
                        const first = index((z) => [z('a', 'b', 'c', 'd')])
                        const second = index((z) => [z('a', 'b', 'c', 'd')])
                        expect(first.a).toBe(second.a)
                        expect(first.b).toBe(second.b)
                        expect(first.c).toBe(second.c)
                        expect(first.d).toBe(second.d)
                })

                it('identical builds share same warns array shape', () => {
                        const first = index((z) => [z('a', 'b', 'c')])
                        const second = index((z) => [z('a', 'b', 'c')])
                        expect(first.warns).toEqual(second.warns)
                })
        })

        describe('single extension preserves base seeds', () => {
                it('extension preserves all base seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('a', 'd', 'b')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })

                it('extension inserting at start preserves all', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('x', 'a')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.x).toBeLessThan(next.a)
                })

                it('extension inserting at end preserves all', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('c', 'y')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.c).toBeLessThan(next.y)
                })

                it('extension inserting in multiple gaps preserves all', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('a', 'd', 'b'), z('b', 'e', 'c')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
        })

        describe('chained extensions preserve all prior seeds', () => {
                it('two chained extensions preserve all seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const ext1 = base((z) => [z('a', 'd', 'b')])
                        const ext2 = ext1((z) => [z('b', 'e', 'c')])
                        expect(ext2.a).toBe(base.a)
                        expect(ext2.b).toBe(base.b)
                        expect(ext2.c).toBe(base.c)
                        expect(ext2.d).toBe(ext1.d)
                })

                it('three chained extensions each preserve prior seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const ext1 = base((z) => [z('a', 'd', 'b')])
                        const ext2 = ext1((z) => [z('b', 'e', 'c')])
                        const ext3 = ext2((z) => [z('d', 'f', 'b')])
                        expect(ext3.a).toBe(base.a)
                        expect(ext3.b).toBe(base.b)
                        expect(ext3.c).toBe(base.c)
                        expect(ext3.d).toBe(ext1.d)
                        expect(ext3.e).toBe(ext2.e)
                })

                it('four chained extensions preserve all accumulated seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c', 'd')])
                        const e1 = base((z) => [z('a', 'x1', 'b')])
                        const e2 = e1((z) => [z('b', 'x2', 'c')])
                        const e3 = e2((z) => [z('c', 'x3', 'd')])
                        const e4 = e3((z) => [z('x1', 'x4', 'b')])
                        expect(e4.a).toBe(base.a)
                        expect(e4.b).toBe(base.b)
                        expect(e4.c).toBe(base.c)
                        expect(e4.d).toBe(base.d)
                        expect(e4.x1).toBe(e1.x1)
                        expect(e4.x2).toBe(e2.x2)
                        expect(e4.x3).toBe(e3.x3)
                })
        })

        describe('tree shorthand extensions', () => {
                it('extension with tree shorthand preserves seeds', () => {
                        const base = index((z) => [z('root', ['s1', 's2', 's3', 's4'])])
                        const ext = base((z) => [z('s1', 'p', 's2')])
                        expect(ext.root).toBe(base.root)
                        expect(ext.s1).toBe(base.s1)
                        expect(ext.s2).toBe(base.s2)
                        expect(ext.s3).toBe(base.s3)
                        expect(ext.s4).toBe(base.s4)
                })

                it('extension with tree form preserves all base seeds', () => {
                        // Error: linear keys must be strings
                        const base = index((z) => [z('a', 'b', 'c')])
                        // @ts-ignore @TODO FIX: Argument of type 'string[]' is not assignable to parameter of type 'string'.ts
                        const next = base((z) => [z('a', ['x', 'y'], 'b')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })

                it('nested tree shorthand extension preserves root', () => {
                        const base = index((z) => [z('a', ['b', ['c', 'd']])])
                        const ext = base((z) => [z('b', 'x', 'c')])
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                        expect(ext.c).toBe(base.c)
                        expect(ext.d).toBe(base.d)
                })
        })

        describe('double extension and overlapping constraints', () => {
                it('inserting twice in same gap preserves all prior seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const ext1 = base((z) => [z('a', 'd', 'b')])
                        const ext2 = ext1((z) => [z('d', 'e', 'b')])
                        expect(ext2.a).toBe(base.a)
                        expect(ext2.b).toBe(base.b)
                        expect(ext2.c).toBe(base.c)
                        expect(ext2.d).toBe(ext1.d)
                })

                it('redundant pair does not change values', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('a', 'd', 'b'), z('d', 'b')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })

                it('reusing same pairs as base does not change values', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('a', 'b')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
        })

        describe('larger bases', () => {
                it('five-node base then extension preserves all five', () => {
                        const base = index((z) => [z('a', 'b', 'c', 'd', 'e')])
                        const next = base((z) => [z('b', 'x', 'c')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.d).toBe(base.d)
                        expect(next.e).toBe(base.e)
                })

                it('wide fan base then chain extension preserves all', () => {
                        const base = index((z) => [z('a', ['b', 'c', 'd'])])
                        const next = base((z) => [z('b', 'x', 'c')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.d).toBe(base.d)
                })
        })

        describe('ordering invariants', () => {
                it('extension preserves stride between seeds', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const stride = base.b - base.a
                        const next = base((z) => [z('a', 'd', 'b')])
                        expect(next.b - next.a).toBe(stride)
                        expect(next.c - next.b).toBe(stride)
                })

                it('extension below minimum preserves base', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('low', 'a')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.low).toBeLessThan(next.a)
                })

                it('extension above maximum preserves base', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('c', 'high')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.c).toBeLessThan(next.high)
                })
        })
})
