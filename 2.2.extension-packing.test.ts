import { describe, expect, it } from 'vitest'
import { index, S } from './utils'

describe('extension packing and boundaries', () => {
        describe('exterior insertions', () => {
                it('insert below lowest seed', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('d', 'a')])
                        expect(next.d).toBeLessThan(next.a)
                        expect(next.b).toBe(base.b)
                })

                it('insert above highest seed', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('b', 'e')])
                        expect(next.a).toBe(base.a)
                        expect(base.b).toBeLessThan(next.e)
                })

                it('both below and above in one extension', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('d', 'a'), z('b', 'e')])
                        expect(next.d).toBeLessThan(next.a)
                        expect(next.b).toBeLessThan(next.e)
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                })

                it('deep chain below minimum seed', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('d1', 'a')])
                        const e2 = e1((z) => [z('d2', 'd1')])
                        const e3 = e2((z) => [z('d3', 'd2')])
                        expect(e3.d3).toBeLessThan(e2.d2)
                        expect(e2.d2).toBeLessThan(e1.d1)
                        expect(e1.d1).toBeLessThan(base.a)
                })

                it('deep chain above maximum seed', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('b', 'e1')])
                        const e2 = e1((z) => [z('e1', 'e2')])
                        const e3 = e2((z) => [z('e2', 'e3')])
                        expect(base.b).toBeLessThan(e1.e1)
                        expect(e1.e1).toBeLessThan(e2.e2)
                        expect(e2.e2).toBeLessThan(e3.e3)
                })
        })

        describe('mixed outer and inner insertions', () => {
                it('mixed outer + inner in one extension', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('d', 'a'), z('a', 'c', 'b'), z('b', 'e')])
                        expect(next.d).toBeLessThan(next.a)
                        expect(next.a).toBeLessThan(next.c)
                        expect(next.c).toBeLessThan(next.b)
                        expect(next.b).toBeLessThan(next.e)
                })

                it('mixed outer + inner followed by second extension', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('d', 'a'), z('a', 'c', 'b'), z('b', 'e')])
                        const e2 = e1((z) => [z('c', 'f', 'b')])
                        expect(e2.d).toBe(e1.d)
                        expect(e2.c).toBe(e1.c)
                        expect(e2.e).toBe(e1.e)
                        expect(e2.c).toBeLessThan(e2.f)
                        expect(e2.f).toBeLessThan(e2.b)
                })
        })

        describe('cluster and region packing', () => {
                it('cluster around center of large gap', () => {
                        const base = index((z) => [z('a', 'b')])
                        const ext = base((z) => [z('a', 'c', 'd', 'e', 'b')])
                        expect(base.a).toBeLessThan(ext.c)
                        expect(ext.c).toBeLessThan(ext.d)
                        expect(ext.d).toBeLessThan(ext.e)
                        expect(ext.e).toBeLessThan(base.b)
                })

                it('insertions across three sibling gaps', () => {
                        const base = index((z) => [z('root', ['left', 'mid', 'edge', 'right'])])
                        const first = base((z) => [z('left', 'l1', 'mid'), z('mid', 'm1', 'edge'), z('edge', 'e1', 'right')])
                        const second = first((z) => [z('l1', 'l2', 'mid'), z('m1', 'm2', 'edge'), z('e1', 'e2', 'right')])
                        expect(second.left).toBe(base.left)
                        expect(second.mid).toBe(base.mid)
                        expect(second.edge).toBe(base.edge)
                        expect(second.right).toBe(base.right)
                        expect(second.l1).toBe(first.l1)
                        expect(second.m1).toBe(first.m1)
                        expect(second.e1).toBe(first.e1)
                })
        })

        describe('cycle detection', () => {
                it('cycle in initial build throws', () => {
                        expect(() => index((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                })

                it('cycle in extension throws', () => {
                        const base = index((z) => [z('a', 'b')])
                        expect(() => base((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                })

                it('three-node cycle in extension throws', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        expect(() => base((z) => [z('a', 'b', 'c'), z('c', 'a')])).toThrow('cycle')
                })

                it('cycle detection does not pollute warns array', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const warnsLen = base.warns.length
                        expect(() => base((z) => [z('a', 'b'), z('b', 'a')])).toThrow('cycle')
                        expect(base.warns.length).toBe(warnsLen)
                })

                it('complex valid DAG does not warn about cycles', () => {
                        const base = index((z) => [z('a', 'b', 'c', 'd')])
                        const ext = base((z) => [z('a', 'x', 'b'), z('b', 'y', 'c'), z('c', 'w', 'd')])
                        const hasCycleWarn = ext.warns.some((w: string) => w.includes('cycle'))
                        expect(hasCycleWarn).toBe(false)
                })
        })

        describe('extension below minimum stays positive', () => {
                it.skip('deep below-minimum extensions should produce positive z-index', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('x1', 'a')])
                        const e2 = e1((z) => [z('x2', 'x1')])
                        const e3 = e2((z) => [z('x3', 'x2')])
                        const e4 = e3((z) => [z('x4', 'x3')])
                        const e5 = e4((z) => [z('x5', 'x4')])
                        expect(e5.x5).toBeLessThan(e5.x4)
                        expect(e5.x5 >= 0).toBe(true)
                })
        })

        describe('exterior insertion uses step-sized gaps', () => {
                it('below insertion uses step-sized spacing', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('d', 'a')])
                        expect(next.a - next.d).toBe(S)
                })

                it('above insertion uses step-sized spacing', () => {
                        const base = index((z) => [z('a', 'b')])
                        const next = base((z) => [z('b', 'e')])
                        expect(next.e - next.b).toBe(S)
                })
        })

        describe('independent chains and identity', () => {
                it('independent gap insertions do not interfere', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const ext1 = base((z) => [z('a', 'd', 'b')])
                        const ext2 = ext1((z) => [z('b', 'e', 'c')])
                        expect(ext2.d).toBe(ext1.d)
                        expect(ext2.d).toBeLessThan(ext2.b)
                        expect(ext2.b).toBeLessThan(ext2.e)
                        expect(ext2.e).toBeLessThan(ext2.c)
                })

                it('restating existing pair is identity', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const next = base((z) => [z('a', 'b')])
                        expect(next.a).toBe(base.a)
                        expect(next.b).toBe(base.b)
                        expect(next.c).toBe(base.c)
                })

                it('dense inner pack with outer extensions preserves fences', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const e1 = base((z) => [z('a', 'd', 'b'), z('low', 'a'), z('c', 'high')])
                        const e2 = e1((z) => [z('d', 'e', 'b')])
                        expect(e2.a).toBe(base.a)
                        expect(e2.b).toBe(base.b)
                        expect(e2.c).toBe(base.c)
                        expect(e2.d).toBe(e1.d)
                        expect(e2.low).toBe(e1.low)
                        expect(e2.high).toBe(e1.high)
                })
        })

        describe('warns for narrow gaps', () => {
                it('many splits produce narrow gap warnings', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'n1', 'b')])
                        const e2 = e1((z) => [z('a', 'n2', 'n1')])
                        const e3 = e2((z) => [z('a', 'n3', 'n2')])
                        const e4 = e3((z) => [z('a', 'n4', 'n3')])
                        const e5 = e4((z) => [z('a', 'n5', 'n4')])
                        const e6 = e5((z) => [z('a', 'n6', 'n5')])
                        const e7 = e6((z) => [z('a', 'n7', 'n6')])
                        const e8 = e7((z) => [z('a', 'n8', 'n7')])
                        const e9 = e8((z) => [z('a', 'n9', 'n8')])
                        const hasNarrow = e9.warns.some((w: string) => w.includes('narrow'))
                        expect(hasNarrow).toBe(true)
                })
        })

        describe('large fan then dense extension', () => {
                it('large fan base with dense extension in one gap', () => {
                        // AssertionError: expected 2052 to be less than 2048
                        //  ❯ 2.2.extension-packing.test.ts:209:40
                        //     207|                         expect(ext.x1).toBeLessThan(ext.x2)
                        //     208|                         expect(ext.x2).toBeLessThan(ext.x3)
                        //     209|                         expect(ext.x3).toBeLessThan(base.c)
                        //        |                                        ^
                        //     210|                 })
                        //     211|         })
                        const base = index((z) => [z('a', ['b', 'c', 'd', 'e', 'f'])])
                        const ext = base((z) => [z('b', 'x1', 'x2', 'x3', 'c')])
                        expect(base.b).toBeLessThan(ext.x1)
                        expect(ext.x1).toBeLessThan(ext.x2)
                        expect(ext.x2).toBeLessThan(ext.x3)
                        expect(ext.x3).toBeLessThan(base.c)
                })
        })
})
