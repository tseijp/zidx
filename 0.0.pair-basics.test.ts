import { describe, expect, it } from 'vitest'
import { dag, S } from './utils'

describe('z function basic API', () => {
        describe('linear chains', () => {
                it('two-key chain: a < b with stride S', () => {
                        const r = dag((z) => [z('a', 'b')])
                                .relative('a', 'b')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                })

                it('three-key chain: a < b < c with uniform stride', () => {
                        const r = dag((z) => [z('a', 'b', 'c')])
                                .relative('a', 'b', 'c')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                })

                it('four-key chain: a < b < c < d with uniform stride', () => {
                        const r = dag((z) => [z('a', 'b', 'c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('five-key chain: a < b < c < d < e with uniform stride', () => {
                        const r = dag((z) => [z('a', 'b', 'c', 'd', 'e')])
                                .relative('a', 'b', 'c', 'd', 'e')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })

                it('chain of length 2 stride equals S (1024)', () => {
                        const r = dag((z) => [z('x', 'y')]).nowarn().raw
                        expect(r.y - r.x).toBe(1024)
                })

                it('single z call with all keys ascending confirms no warns', () => {
                        dag((z) => [z('a', 'b', 'c', 'd', 'e')])
                                .relative('a', 'b', 'c', 'd', 'e')
                                .nowarn()
                })
        })

        describe('parent with array children', () => {
                it('parent + 2 array children: a < b, a < c', () => {
                        dag((z) => [z('a', ['b', 'c'])])
                                .absolute(['a', 'b'], ['a', 'c'])
                                .nowarn()
                })

                it('parent + 3 array children: a < b, a < c, a < d', () => {
                        dag((z) => [z('a', ['b', 'c', 'd'])])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'])
                                .nowarn()
                })

                it('parent + 4 array children: a < all', () => {
                        dag((z) => [z('a', ['b', 'c', 'd', 'e'])])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'])
                                .nowarn()
                })

                it('reversed child order in array: a < c < b (declared order)', () => {
                        dag((z) => [z('a', ['c', 'b'])])
                                .absolute(['a', 'c'], ['a', 'b'])
                                .nowarn()
                })

                it('nested arrays flattened: z("a",["b",["c","d"],"e"])', () => {
                        dag((z) => [z('a', ['b', ['c', 'd'], 'e'])])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'])
                                .nowarn()
                })

                it('deeply nested array: z("a",[["b","c"],["d","e"],"f"])', () => {
                        dag((z) => [z('a', [['b', 'c'], ['d', 'e'], 'f'])])
                                .absolute(['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'], ['a', 'f'])
                                .nowarn()
                })
        })

        describe('multiple z calls', () => {
                it('mixed: chain + parent-array', () => {
                        dag((z) => [z('a', 'b', 'c'), z('b', ['d', 'e'])])
                                .absolute(['a', 'b'], ['b', 'c'], ['b', 'd'], ['b', 'e'])
                                .nowarn()
                })

                it('two separate chains: z("a","b"), z("c","d")', () => {
                        const r = dag((z) => [z('a', 'b'), z('c', 'd')]).nowarn().raw
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.c).toBeLessThan(r.d)
                })

                it('overlapping chains: z("a","b"), z("b","c") same as z("a","b","c")', () => {
                        dag((z) => [z('a', 'b'), z('b', 'c')])
                                .relative('a', 'b', 'c')
                                .nowarn()
                })

                it('reversed declaration order: z("b","c"), z("a","b") still a < b < c', () => {
                        dag((z) => [z('b', 'c'), z('a', 'b')])
                                .relative('a', 'b', 'c')
                                .nowarn()
                })

                it('multiple overlapping: z("a","b"), z("b","c"), z("c","d")', () => {
                        dag((z) => [z('a', 'b'), z('b', 'c'), z('c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .nowarn()
                })

                it('separate chains have independent ordering', () => {
                        const r = dag((z) => [z('a', 'b'), z('c', 'd')]).nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('three overlapping pairs form consistent chain', () => {
                        const r = dag((z) => [z('a', 'b'), z('b', 'c'), z('c', 'd')])
                                .relative('a', 'b', 'c', 'd')
                                .nowarn().raw
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })
        })

        describe('stride uniformity', () => {
                it('linear chain stride is constant across all gaps', () => {
                        const r = dag((z) => [z('a', 'b', 'c', 'd', 'e')]).nowarn().raw
                        const stride = r.b - r.a
                        expect(r.c - r.b).toBe(stride)
                        expect(r.d - r.c).toBe(stride)
                        expect(r.e - r.d).toBe(stride)
                })

                it('overlapping chains produce same stride as single chain', () => {
                        const single = dag((z) => [z('a', 'b', 'c')]).nowarn().raw
                        const multi = dag((z) => [z('a', 'b'), z('b', 'c')]).nowarn().raw
                        expect(multi.b - multi.a).toBe(single.b - single.a)
                        expect(multi.c - multi.b).toBe(single.c - single.b)
                })
        })
})
