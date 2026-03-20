import { describe, expect, it } from 'vitest'
import { index } from './index'
import { S } from './utils'

describe('extension seed stability', () => {
        describe('deterministic builds', () => {
                it('identical chain builds produce identical ranks', () => {
                        const first = index((z) => z('a', 'b', 'c'))
                        const second = index((z) => z('a', 'b', 'c'))
                        expect(first.a).toBe(second.a)
                        expect(first.b).toBe(second.b)
                        expect(first.c).toBe(second.c)
                })
                it('identical fan builds produce identical ranks', () => {
                        const first = index((z) => z('a', ['b', 'c']))
                        const second = index((z) => z('a', ['b', 'c']))
                        expect(first.a).toBe(second.a)
                        expect(first.b).toBe(second.b)
                        expect(first.c).toBe(second.c)
                })
        })

        describe('single extension preserves base seeds', () => {
                it('insert at start preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('x', 'a')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('insert at end preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('c', 'y')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('insert in middle preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('a', 'd', 'b')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('insert in multiple gaps preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => [z('a', 'd', 'b'), z('b', 'e', 'c')]) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('insert with array children preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('a', ['x', 'y'], 'b')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
        })

        describe('chained extensions preserve accumulated seeds', () => {
                it('two chained: base a,b,c + ext1.d preserved', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const ext1 = base((z) => z('a', 'd', 'b'))
                        const ext2 = ext1((z) => z('b', 'e', 'c')) // @ts-expect-error
                        ext2._
                        expect(ext2.a).toBe(base.a)
                        expect(ext2.b).toBe(base.b)
                        expect(ext2.c).toBe(base.c)
                        expect(ext2.d).toBe(ext1.d)
                })
                it('three chained: base + ext1.d + ext2.e preserved', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const ext1 = base((z) => z('a', 'd', 'b'))
                        const ext2 = ext1((z) => z('b', 'e', 'c'))
                        const ext3 = ext2((z) => z('d', 'f', 'b')) // @ts-expect-error
                        ext3._
                        expect(ext3.a).toBe(base.a)
                        expect(ext3.b).toBe(base.b)
                        expect(ext3.c).toBe(base.c)
                        expect(ext3.d).toBe(ext1.d)
                        expect(ext3.e).toBe(ext2.e)
                })
                it('four chained: all accumulated seeds preserved', () => {
                        const base = index((z) => z('a', 'b', 'c', 'd'))
                        const e1 = base((z) => z('a', 'x1', 'b'))
                        const e2 = e1((z) => z('b', 'x2', 'c'))
                        const e3 = e2((z) => z('c', 'x3', 'd'))
                        const e4 = e3((z) => z('x1', 'x4', 'b')) // @ts-expect-error
                        e4._
                        expect(e4.a).toBe(base.a)
                        expect(e4.b).toBe(base.b)
                        expect(e4.c).toBe(base.c)
                        expect(e4.d).toBe(base.d)
                        expect(e4.x1).toBe(e1.x1)
                        expect(e4.x2).toBe(e2.x2)
                        expect(e4.x3).toBe(e3.x3)
                })
        })

        describe('fan and tree base preservation', () => {
                it('fan base + sibling extension preserves all', () => {
                        const base = index((z) => z('root', ['s1', 's2', 's3', 's4']))
                        const ext = base((z) => z('s1', 'p', 's2')) // @ts-expect-error
                        ext._
                        expect(ext.root).toBe(base.root)
                        expect(ext.s1).toBe(base.s1)
                        expect(ext.s2).toBe(base.s2)
                        expect(ext.s3).toBe(base.s3)
                        expect(ext.s4).toBe(base.s4)
                })
                it('wide fan + extension preserves all', () => {
                        const base = index((z) => z('a', ['b', 'c', 'd']))
                        const next = base((z) => z('b', 'x', 'c')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.d).toBe(base.d)
                })
                it('nested tree + extension preserves all', () => {
                        const base = index((z) => z('a', ['b', ['c', 'd']]))
                        const ext = base((z) => z('b', 'x', 'c')) // @ts-expect-error
                        ext._
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                        expect(ext.c).toBe(base.c)
                        expect(ext.d).toBe(base.d)
                })
        })

        describe('identity extensions', () => {
                it('restating same pairs preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('a', 'b')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('redundant pair preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => [z('a', 'd', 'b'), z('d', 'b')]) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
                it('reusing all original pairs preserves base a,b,c', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const next = base((z) => z('a', 'b', 'c')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })
        })

        describe('ordering invariants', () => {
                it('stride preserved after extension', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const stride = base.b - base.a
                        const next = base((z) => z('a', 'd', 'b')) // @ts-expect-error
                        next._
                        expect(next.b - next.a).toBe(stride)
                        expect(next.c - next.b).toBe(stride)
                })
                it('extension below minimum preserves base and stride', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const stride = base.b - base.a
                        const next = base((z) => z('low', 'a')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.b - next.a).toBe(stride)
                })
                it('extension above maximum preserves base and stride', () => {
                        const base = index((z) => z('a', 'b', 'c'))
                        const stride = base.b - base.a
                        const next = base((z) => z('c', 'high')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.b - next.a).toBe(stride)
                })
        })

        describe('hi-direction extension preserves seeds', () => {
                it('2-node hi: a=S b=2S preserved, c=3S', () => {
                        const base = index((z) => z('a', 'b'))
                        const ext = base((z) => z('b', 'c')) // @ts-expect-error
                        ext._
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                        expect(ext.a).toBe(S)
                        expect(ext.b).toBe(2 * S)
                        expect(ext.c).toBe(3 * S)
                })
                it('2-node hi chained: a,b,c preserved', () => {
                        const base = index((z) => z('a', 'b'))
                        const e1 = base((z) => z('b', 'c'))
                        const e2 = e1((z) => z('c', 'd')) // @ts-expect-error
                        e2._
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(e1.c)
                })
                it('3-node hi: a,b preserved', () => {
                        const base = index((z) => z('a', 'b'))
                        const ext = base((z) => z('b', 'c', 'd')) // @ts-expect-error
                        ext._
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                })
                it('3-node hi chained: a,b,c,d preserved', () => {
                        const base = index((z) => z('a', 'b'))
                        const e1 = base((z) => z('b', 'c', 'd'))
                        const e2 = e1((z) => z('c', 'x', 'd')) // @ts-expect-error
                        e2._
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(e1.c)
                        expect(e2.d).toBe(e1.d)
                })
        })

        describe('lo-direction extension preserves seeds', () => {
                it('2-node lo: a,b preserved', () => {
                        const base = index((z) => z('b', 'a'))
                        const ext = base((z) => z('c', 'b')) // @ts-expect-error
                        ext._
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                })
                it('2-node lo chained: a,b,c preserved', () => {
                        const base = index((z) => z('b', 'a'))
                        const e1 = base((z) => z('c', 'b'))
                        const e2 = e1((z) => z('d', 'c')) // @ts-expect-error
                        e2._
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(e1.c)
                })
                it('3-node lo: a,b preserved', () => {
                        const base = index((z) => z('b', 'a'))
                        const ext = base((z) => z('d', 'c', 'b')) // @ts-expect-error
                        ext._
                        expect(ext.a).toBe(base.a)
                        expect(ext.b).toBe(base.b)
                })
                it('3-node lo chained: a,b,c,d preserved', () => {
                        const base = index((z) => z('b', 'a'))
                        const e1 = base((z) => z('d', 'c', 'b'))
                        const e2 = e1((z) => z('d', 'x', 'c')) // @ts-expect-error
                        e2._
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(e1.c)
                        expect(e2.d).toBe(e1.d)
                })
        })

        describe('larger bases', () => {
                it('five-node base + extension preserves all five', () => {
                        const base = index((z) => z('a', 'b', 'c', 'd', 'e'))
                        const next = base((z) => z('b', 'x', 'c')) // @ts-expect-error
                        next._
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                        expect(next.d).toBe(base.d)
                        expect(next.e).toBe(base.e)
                })
                it('five-node base + two extensions preserves all', () => {
                        const base = index((z) => z('a', 'b', 'c', 'd', 'e'))
                        const e1 = base((z) => z('b', 'x', 'c'))
                        const e2 = e1((z) => z('d', 'y', 'e')) // @ts-expect-error
                        e2._
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(base.c)
                        expect(e2.d).toBe(base.d)
                        expect(e2.e).toBe(base.e)
                        expect(e2.x).toBe(e1.x)
                })
        })
})
