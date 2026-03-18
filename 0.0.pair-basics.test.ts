import { describe, expect, it } from 'vitest'
import { index } from './index'
import { absolute, relative, S } from './utils'

describe('z function basic API', () => {
        describe('linear chains', () => {
                it('two-key chain: a < b with stride S', () => {
                        const r = index((z) => z('a', 'b'))
                        relative(r, 'a', 'b') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                })

                it('three-key chain: a < b < c with uniform stride', () => {
                        const r = index((z) => z('a', 'b', 'c'))
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                })

                it('four-key chain: a < b < c < d with uniform stride', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd'))
                        relative(r, 'a', 'b', 'c', 'd') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('five-key chain: a < b < c < d < e with uniform stride', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e'))
                        relative(r, 'a', 'b', 'c', 'd', 'e') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                        expect(r.e - r.d).toBe(S)
                })

                it('chain of length 2 stride equals S (1024)', () => {
                        const r = index((z) => z('x', 'y')) // @ts-expect-error
                        r._
                        expect(r.y - r.x).toBe(1024)
                })

                it('single z call with all keys ascending confirms no warns', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e'))
                        relative(r, 'a', 'b', 'c', 'd', 'e') // @ts-expect-error
                        r._
                })
        })

        describe('parent with array children', () => {
                it('parent + 2 array children: a < b, a < c', () => {
                        const r = index((z) => z('a', ['b', 'c']))
                        absolute(r, ['a', 'b'], ['a', 'c']) // @ts-expect-error
                        r._
                })

                it('parent + 3 array children: a < b, a < c, a < d', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd']))
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd']) // @ts-expect-error
                        r._
                })

                it('parent + 4 array children: a < all', () => {
                        const r = index((z) => z('a', ['b', 'c', 'd', 'e']))
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e']) // @ts-expect-error
                        r._
                })

                it('reversed child order in array: a < c < b (declared order)', () => {
                        const r = index((z) => z('a', ['c', 'b']))
                        absolute(r, ['a', 'c'], ['a', 'b']) // @ts-expect-error
                        r._
                })

                it('nested arrays flattened: z("a",["b",["c","d"],"e"])', () => {
                        const r = index((z) => z('a', ['b', ['c', 'd'], 'e']))
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e']) // @ts-expect-error
                        r._
                })

                it('deeply nested array: z("a",[["b","c"],["d","e"],"f"])', () => {
                        const r = index((z) => z('a', [['b', 'c'], ['d', 'e'], 'f']))
                        absolute(r, ['a', 'b'], ['a', 'c'], ['a', 'd'], ['a', 'e'], ['a', 'f']) // @ts-expect-error
                        r._
                })
        })

        describe('multiple z calls', () => {
                it('mixed: chain + parent-array', () => {
                        const r = index((z) => [z('a', 'b', 'c'), z('b', ['d', 'e'])])
                        absolute(r, ['a', 'b'], ['b', 'c'], ['b', 'd'], ['b', 'e']) // @ts-expect-error
                        r._
                })

                it('two separate chains: z("a","b"), z("c","d")', () => {
                        const r = index((z) => [z('a', 'b'), z('c', 'd')]) // @ts-expect-error
                        r._
                        expect(r.a).toBeLessThan(r.b)
                        expect(r.c).toBeLessThan(r.d)
                })

                it('overlapping chains: z("a","b"), z("b","c") same as z("a","b","c")', () => {
                        const r = index((z) => [z('a', 'b'), z('b', 'c')])
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                })

                it('reversed declaration order: z("b","c"), z("a","b") still a < b < c', () => {
                        const r = index((z) => [z('b', 'c'), z('a', 'b')])
                        relative(r, 'a', 'b', 'c') // @ts-expect-error
                        r._
                })

                it('multiple overlapping: z("a","b"), z("b","c"), z("c","d")', () => {
                        const r = index((z) => [z('a', 'b'), z('b', 'c'), z('c', 'd')])
                        relative(r, 'a', 'b', 'c', 'd') // @ts-expect-error
                        r._
                })

                it('separate chains have independent ordering', () => {
                        const r = index((z) => [z('a', 'b'), z('c', 'd')]) // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })

                it('three overlapping pairs form consistent chain', () => {
                        const r = index((z) => [z('a', 'b'), z('b', 'c'), z('c', 'd')])
                        relative(r, 'a', 'b', 'c', 'd') // @ts-expect-error
                        r._
                        expect(r.b - r.a).toBe(S)
                        expect(r.c - r.b).toBe(S)
                        expect(r.d - r.c).toBe(S)
                })
        })

        describe('stride uniformity', () => {
                it('linear chain stride is constant across all gaps', () => {
                        const r = index((z) => z('a', 'b', 'c', 'd', 'e')) // @ts-expect-error
                        r._
                        const stride = r.b - r.a
                        expect(r.c - r.b).toBe(stride)
                        expect(r.d - r.c).toBe(stride)
                        expect(r.e - r.d).toBe(stride)
                })

                it('overlapping chains produce same stride as single chain', () => {
                        const single = index((z) => z('a', 'b', 'c'))
                        const multi = index((z) => [z('a', 'b'), z('b', 'c')])
                        expect(multi.b - multi.a).toBe(single.b - single.a)
                        expect(multi.c - multi.b).toBe(single.c - single.b)
                })
        })
})
