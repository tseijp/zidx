import { describe, expect, it } from 'vitest'
import { index, mid } from './utils'

describe('extension density and gap shrinkage', () => {
        describe('single midpoint insertion', () => {
                it('inserts at midpoint of two seeds', () => {
                        const base = index((z) => [z('a', 'b')])
                        const ext = base((z) => [z('a', 'c', 'b')])
                        expect(ext.c).toBe(mid(base.a + 1, base.b - 1))
                })

                it('midpoint is between the two seeds', () => {
                        const base = index((z) => [z('a', 'b')])
                        const ext = base((z) => [z('a', 'c', 'b')])
                        expect(base.a).toBeLessThan(ext.c)
                        expect(ext.c).toBeLessThan(base.b)
                })
        })

        describe('successive left-side insertions', () => {
                it('two left-side insertions halve gap twice', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        expect(e1.c).toBe(mid(base.a + 1, base.b - 1))
                        expect(e2.d).toBe(mid(base.a + 1, e1.c - 1))
                })

                it('three left-side insertions halve gap three times', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('a', 'e', 'd')])
                        expect(e3.e).toBe(mid(base.a + 1, e2.d - 1))
                })
        })

        describe('successive right-side insertions', () => {
                it('right-side insertions approach upper bound', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('c', 'd', 'b')])
                        const e3 = e2((z) => [z('d', 'e', 'b')])
                        expect(e1.c).toBeLessThan(e2.d)
                        expect(e2.d).toBeLessThan(e3.e)
                        expect(e3.e).toBeLessThan(base.b)
                })

                it('right-side insertion midpoint values', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('c', 'd', 'b')])
                        expect(e2.d).toBe(mid(e1.c + 1, base.b - 1))
                })
        })

        describe('both-side insertions from midpoint', () => {
                it('left and right of midpoint', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('c', 'e', 'b')])
                        expect(e2.d).toBeLessThan(e1.c)
                        expect(e1.c).toBeLessThan(e3.e)
                        expect(e3.e).toBeLessThan(base.b)
                })
        })

        describe('earlier insertions remain stable', () => {
                it('first insertion stable after second', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        expect(e2.c).toBe(e1.c)
                })

                it('first and second insertions stable after third', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('a', 'e', 'd')])
                        expect(e3.c).toBe(e1.c)
                        expect(e3.d).toBe(e2.d)
                })
        })

        describe('gap halving property', () => {
                it('each insertion halves the available gap', () => {
                        const base = index((z) => [z('a', 'b')])
                        const gap0 = base.b - base.a
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const gap1a = e1.c - e1.a
                        const gap1b = e1.b - e1.c
                        expect(gap1a).toBeLessThan(gap0)
                        expect(gap1b).toBeLessThan(gap0)
                })

                it('five successive insertions shrink gap monotonically', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('a', 'e', 'd')])
                        const e4 = e3((z) => [z('a', 'f', 'e')])
                        const e5 = e4((z) => [z('a', 'g', 'f')])
                        expect(e5.g - e5.a).toBeLessThan(e4.f - e4.a)
                        expect(e4.f - e4.a).toBeLessThan(e3.e - e3.a)
                        expect(e3.e - e3.a).toBeLessThan(e2.d - e2.a)
                })
        })

        describe('insert between non-seed neighbors', () => {
                it('insert between two extension-created nodes', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('d', 'e', 'c')])
                        expect(e2.d).toBeLessThan(e3.e)
                        expect(e3.e).toBeLessThan(e1.c)
                })
        })

        describe('dense packing in one region', () => {
                it('only insert between a,b leaves b,c gap unchanged', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const gapBC = base.c - base.b
                        const ext = base((z) => [z('a', 'd', 'b')])
                        expect(ext.c - ext.b).toBe(gapBC)
                })

                it('multiple insertions between a,b do not affect b,c', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const gapBC = base.c - base.b
                        const e1 = base((z) => [z('a', 'd', 'b')])
                        const e2 = e1((z) => [z('a', 'e', 'd')])
                        expect(e2.c - e2.b).toBe(gapBC)
                })
        })

        describe('multiple simultaneous insertions', () => {
                it('three nodes inserted at once between a and b', () => {
                        const base = index((z) => [z('a', 'b')])
                        const ext = base((z) => [z('a', 'c', 'd', 'e', 'b')])
                        expect(base.a).toBeLessThan(ext.c)
                        expect(ext.c).toBeLessThan(ext.d)
                        expect(ext.d).toBeLessThan(ext.e)
                        expect(ext.e).toBeLessThan(base.b)
                })

                it('simultaneous insertions in different gaps', () => {
                        const base = index((z) => [z('a', 'b', 'c')])
                        const ext = base((z) => [z('a', 'd', 'b'), z('b', 'e', 'c')])
                        expect(base.a).toBeLessThan(ext.d)
                        expect(ext.d).toBeLessThan(base.b)
                        expect(base.b).toBeLessThan(ext.e)
                        expect(ext.e).toBeLessThan(base.c)
                })
        })

        describe('fencing behavior', () => {
                it('first extension node acts as fence in second extension', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        expect(e2.d).toBe(mid(base.a + 1, e1.c - 1))
                })
        })

        describe('deep insertion chain', () => {
                it('eight successive insertions show consistent halving', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'n1', 'b')])
                        const e2 = e1((z) => [z('a', 'n2', 'n1')])
                        const e3 = e2((z) => [z('a', 'n3', 'n2')])
                        const e4 = e3((z) => [z('a', 'n4', 'n3')])
                        const e5 = e4((z) => [z('a', 'n5', 'n4')])
                        const e6 = e5((z) => [z('a', 'n6', 'n5')])
                        const e7 = e6((z) => [z('a', 'n7', 'n6')])
                        const e8 = e7((z) => [z('a', 'n8', 'n7')])
                        const gaps = [e1.n1 - base.a, e2.n2 - base.a, e3.n3 - base.a, e4.n4 - base.a, e5.n5 - base.a, e6.n6 - base.a, e7.n7 - base.a, e8.n8 - base.a]
                        for (let i = 1; i < gaps.length; i += 1) expect(gaps[i]).toBeLessThan(gaps[i - 1])
                })
        })

        describe('chain ordering', () => {
                it('left-biased chain maintains strict ordering', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'x1', 'b')])
                        const e2 = e1((z) => [z('a', 'x2', 'x1')])
                        const e3 = e2((z) => [z('a', 'x3', 'x2')])
                        expect(base.a).toBeLessThan(e3.x3)
                        expect(e3.x3).toBeLessThan(e2.x2)
                        expect(e2.x2).toBeLessThan(e1.x1)
                        expect(e1.x1).toBeLessThan(base.b)
                })

                it('alternating sides maintain ordering', () => {
                        const base = index((z) => [z('a', 'b')])
                        const e1 = base((z) => [z('a', 'c', 'b')])
                        const e2 = e1((z) => [z('a', 'd', 'c')])
                        const e3 = e2((z) => [z('c', 'e', 'b')])
                        expect(base.a).toBeLessThan(e2.d)
                        expect(e2.d).toBeLessThan(e1.c)
                        expect(e1.c).toBeLessThan(e3.e)
                        expect(e3.e).toBeLessThan(base.b)
                })
        })
})
