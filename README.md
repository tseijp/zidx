# 💤 z-idx

z-index DAG builder converting declarative stacking rules into stable numeric layers for shared UI libraries.

## Contents

<table>
<tr valign="top">
<td nowrap>

1. [Getting Started](#getting-started)
      1. [Installation](#installation)
      2. [Example](#example)
      3. [Purpose](#purpose)
2. [Rationale](#rationale)
      1. [Core Concepts](#core-concepts)
      2. [Type Inference](#type-inference)
      3. [API Surface](#api-surface)

</td>
<td nowrap>

3. [Pair Catalogue](#pair-catalogue)
      1. [Pair Basics](#pair-basics)
      2. [Pair Recursion](#pair-recursion)
      3. [Pair Inference](#pair-inference)
4. [Topology Atlas](#topology-atlas)
      1. [Three Nodes](#three-nodes)
      2. [Four Nodes](#four-nodes)
      3. [Five Nodes](#five-nodes)

</td>
<td nowrap>

5. [Extensions](#extensions)
      1. [Extension Stability](#extension-stability)
      2. [Extension Density](#extension-density)
      3. [Extension Packing](#extension-packing)
6. [Appendix](#appendix)
      1. [Design Notes](#design-notes)
      2. [Contributing](#contributing)
      3. [License](#license)

</td>
</tr>
</table>

## Getting Started

### Installation

```
npm i z-idx
```

### Example

```tsx
const base = index((z) => z('primary overlay', ['primary modal', 'Github']), { step: 1 })
const next = base((z) => z('primary modal', 'secondary overlay', 'secondary modal'))

if (base.Github !== next.Github) throw Error()

render(<MenuPlayground next={next} />)
```

### Purpose

z-idx turns declarative partial-order z-relations into numeric stacking ranks that stay stable when extended.
It accepts linear chains, parent-to-children trees, and nested pairs,
lifting all key names into TypeScript inference so downstream packages share identical numbers even after override phases.

## Rationale

### Core Concepts

A z-idx build receives a helper z. Passing multiple strings like `z('a','b','c')` emits ordered pairs `a<b<c` with uniform stride.
Passing a parent and an array such as `z('a',['b','c','d'])` links the parent below each child while placing siblings at the same rank.
Nested arrays or previously returned Edge can be embedded, enabling tree-shaped DAGs without losing ordering.
Ranks start at START (`1<<10`) with stride STEP (`1<<10`) so later inserts can bisect gaps without moving seeded nodes.
A topological pass (Kahn) rejects cycles; a second pass computes lower and upper bounds per node.

### Type Inference

z-idx returns an object that is both callable and map-like. Every key encountered during build is captured in the return type,
allowing editors to suggest properties (`base.a`, `base.b`) and to hint previous keys during extension (`base((z)=>[z('b','x','c')])`).
Edges preserve their embedded key set even when nested inside arrays, so deeply composed trees still surface full autocomplete.

### API Surface

```ts
(build: (z: ZFun) => P): ZApi<Keys<P>>
```

`ZFun` supports two shapes. Linear form: `z(lower, mid, upper, ...)` creates consecutive relations.
Tree form: `z(parent, childrenArray)` where childrenArray may contain strings, nested arrays,
or Edge; siblings in an array share the same rank.
Returned `ZApi` is callable for extension and exposes numeric ranks keyed by name.

## Pair Catalogue

### Pair Basics

Deterministic stride across linear chains: `z('a','b','c','d')` yields ascending ranks with constant gap.
Parent-array flattening: `z('a',['b','c','d'])` keeps `a` below each child and places siblings at the same rank.
Mixed declarations co-exist: a chain plus subtree (`z('a','b','c'), z('b',['d','e'])`) still keeps a uniform step.
Deeply nested arrays collapse into one level above the parent while preserving sibling rank equality.
Composite inference confirms all keys `{a,b,c,d,e}` appear numerically typed.

### Pair Recursion

Edge can be reused as children.
Building `z('a',[z('b','c','d'),'e'])` links `a` below the chain `b<c<d` and also below the sibling `e`.
Multiple tagged subtrees under one parent share the parent as lower bound and maintain their own internal ordering.
Mixed top-level chains with sibling arrays maintain uniform stride while branching at each fork point.
Inference spans linear, array, and tagged inputs ensuring the returned shape exposes every node.

### Pair Inference

Nested tagged subtrees recurse without losing step: `z('a',[z('b',[z('c','d'),'e']), z('f',['g'])])` yields monotone ranks where `a` sits below both `b` and `f`, with `b` below `c<d` and `e`, while `f` sits below `g`.
Deeply wrapped sibling arrays such as `z('a',[['b','c'],['d','e'],'f'])` flatten into ordered groups above `a` where sub-arrays introduce ordering between groups.
Extensions that combine chain and tree forms leave seeds untouched while placing new nodes between them;
new keys remain greater than their lower bounds and below preserved uppers.
Further composition (`z('a',['b','c']), z('b',[z('d',['e',z('f','g')]),'h'])`) keeps all eight keys ordered and accessible on the returned API.

## Topology Atlas

### Three Nodes

All six non-isomorphic DAG shapes for three vertices are expressible.
Straight chain `a<b<c` stays sorted.
Single-parent sibling array `a<[b,c]` places both children at the same rank above the parent.
Dual roots into one sink (`a->c, b->c`) converge cleanly.
Fully dense triangle (`a->b, a->c, b->c`) respects transitivity.
Nested pair arrays `z('a',[z('b','c')])` flatten to the same order.
Late-arriving ancestor pairs still yield the canonical topological sequence.

<table>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
```

```ts
z(['a', 'b', 'c'])
```

</td>
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
    a --> b
```

```ts
z('a', 'b')
```

</td>
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
    a --> b
    a --> c
```

```ts
z('a', ['b', 'c'])
```

</td>
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
    b ---> a
    c ---> a
```

```ts
z(['b', 'c'], 'a')
```

</td>
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
    a --> b
    b --> c
```

```ts
z('a', 'b', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart TB
    g[" "]
    a ~~~ g
    g ~~~ b
    g ~~~ c
    style g fill:none,stroke:none,color:none
    a --> b
    b --> c
    a --> c
```

```ts
z('a', 'b', 'c'), z('a', 'c')
```

</td>
</tr>
</table>

### Four Nodes

The catalogue of four-vertex DAGs (31 shapes) maps onto builds combining chains, fans, diamonds, ladders, and merged roots.
Examples include diamond `a->b, a->c, b->d, c->d`, balanced forks `a->[b,c,d]`,
reversed sibling order `a->[d,c,b]`, cross-braced ladders `a->b, a->c, b->c, c->d`,
parallel roots with tails, and dual roots merging before a sink.
Deterministic spacing holds across all enumerated isomorphism classes, with chains producing uniform stride and fan siblings sharing equal rank.

#### 6 edges

<table>
<tr valign="bottom"><td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    b --> d
    a --> d
    b --> c
    c --> d
```

```ts
z(['a', 'b'], ['c', 'd']), z('a', 'b'), z('c', 'd')
```

</td>
</tr>
</table>

#### 5 edges

<table>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    b --> d
    a --> b
    a --> d
    a --> c
    b --> c
```

```ts
z(['a', 'b'], ['c', 'd']), z('a', 'b')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> d
    c --> d
    b --> d
    b --> c
```

```ts
z(['a', 'b'], ['c', 'd']), z('c', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> b
    c --> d
    a --> d
    b --> c
```

```ts
z('a', ['b', 'c', 'd']), z('b', 'c', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> d
    a --> c
    b --> d
    c --> d
```

```ts
z('a', ['b', 'c'], 'd'), z('a', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> b
    b --> c
    c --> d
    b --> d
```

```ts
z('a', ['b', 'c'], 'd'), z('b', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> d
    b --> c
    b --> d
    c --> d
```

```ts
z('a', 'b', ['c', 'd']), z(['a', 'c'], 'd')
```

</td>
</tr>
</table>

#### 4 edges

<table>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    b --> d
    a --> d
    b --> c
```

```ts
z(['a', 'b'], ['c', 'd'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    a --> d
    b --> c
```

```ts
z('a', ['b', 'c', 'd']), z('b', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    b --> c
    b --> d
```

```ts
z('a', ['b', 'c']), z('b', ['c', 'd'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    b --> c
    c --> d
```

```ts
z('a', 'b', 'c', 'd'), z('a', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> d
    b --> c
    c --> d
```

```ts
z('a', 'b', 'c', 'd'), z('a', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> d
    b --> c
    c --> d
```

```ts
z(['a', 'b'], 'c', 'd'), z('a', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    b --> d
    c --> d
```

```ts
z('a', ['b', 'c'], 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> d
    b --> d
    c --> d
```

```ts
z('a', ['c', 'd']), z(['b', 'c'], 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    b --> c
    b --> d
    c --> d
```

```ts
z('a', 'b', 'c', 'd'), z('b', 'd')
```

</td>
</tr>
</table>

#### 3 edges

<table>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    a --> d
```

```ts
z('a', ['b', 'c', 'd'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
    b --> c
```

```ts
z('a', ['b', 'c']), z('b', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    a --> d
    b --> c
```

```ts
z(['a', 'b'], 'c'), z('a', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    b --> c
    b --> d
```

```ts
z('a', 'b', ['c', 'd'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    b --> c
    c --> d
```

```ts
z('a', 'b', 'c', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    b --> c
    c --> d
```

```ts
z(['a', 'b'], 'c', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> d
    b --> c
    c --> d
```

```ts
z('a', 'd'), z('b', 'c', 'd')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> d
    b --> d
    c --> d
```

```ts
z(['a', 'b', 'c'], 'd')
```

</td>
</tr>
</table>

#### 2 edges

<table>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    b --> c
```

```ts
z('a', 'b', 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    a --> c
```

```ts
z('a', ['b', 'c'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        b
    end
    subgraph y[" "]
        direction TB
        c
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> c
    b --> c
```

```ts
z(['a', 'b'], 'c')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
    c --> d
```

```ts
z('a', 'b'), z('c', 'd')
```

</td>
</tr>
</table>

#### 1 edges

<table>
<tr><td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
    a --> b
```

```ts
z('a', 'b')
```

</td>
</tr>
</table>

#### 0 edges

<table>
<tr><td nowrap>

```mermaid
flowchart LR
    subgraph x[" "]
        direction TB
        a
        c
    end
    subgraph y[" "]
        direction TB
        b
        d
    end
    a ~~~ b
    c ~~~ d
    style x fill:none,stroke:none
    style y fill:none,stroke:none
```

```ts
z(['a', 'b', 'c', 'd'])
```

</td>
</tr>
</table>

### Five Nodes

Five-vertex coverage extends chains, wide fans, multi-source funnels, diamonds with tails, interleaved ladders,
balanced two-level trees, partial fans with extended child, mid-node splits, and diamonds with head.
Each construction confirms sorted order, equal stride between consecutive nodes in the topological sequence, and stable root-to-leaf monotonicity even as edges multiply.
The tests validate that every key participates in the final ordering and that no hidden permutations violate declared constraints.

<table>
<tr><th>chain</th><th>wide fan</th><th>funnel</th><th>diamond tail</th></tr>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    b --> c
    c --> d
    d --> e
```

```ts
z('a', 'b', 'c', 'd', 'e')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    a --> c
    a --> d
    a --> e
```

```ts
z('a', ['b', 'c', 'd', 'e'])
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> e
    b --> e
    c --> e
    d --> e
```

```ts
z(['a', 'b', 'c', 'd'], 'e')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    a --> c
    b --> d
    c --> d
    d --> e
```

```ts
z('a', ['b', 'c'], 'd', 'e')
```

</td>
</tr>

<tr><th>interleaved ladders</th><th>balanced two-level</th><th>fan with deep child</th><th>diamond head</th></tr>
<tr valign="bottom">
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    b --> e
    a --> c
    c --> d
    d --> e
```

```ts
z('a', 'b', 'e'), z('a', 'c', 'd', 'e')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    a --> c
    b --> d
    c --> e
```

```ts
z('a', 'b', 'd'), z('a', 'c', 'e')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    a --> c
    a --> d
    d --> e
```

```ts
z('a', ['b', 'c', 'd']), z('d', 'e')
```

</td>
<td nowrap>

```mermaid
flowchart LR
    g[" "]
    g ~~~ a
    g ~~~ b
    g ~~~ c
    g ~~~ d
    g ~~~ e
    style g fill:none,stroke:none,color:none
    a --> b
    b --> c
    b --> d
    c --> e
    d --> e
```

```ts
z('a', 'b', ['c', 'd'], 'e')
```

</td>
</tr>
</table>

## Extensions

### Extension Stability

First builds are reproducible: identical inputs yield identical ranks.
Extending with additional relations preserves all seeded values while inserting newcomers at midpoints between valid bounds (`d = mid(a+1, b-1)`).
Multiple extensions chained in different regions keep earlier inserts fixed, showing that rank assignment uses seeds as immutable fences.
When nested tree shorthand seeds wide gaps, subsequent inserts between siblings respect original positions and narrow gaps symmetrically.

### Extension Density

Iterative midpoint insertions demonstrate gap shrinkage.
Starting from `a<b`, successive overrides insert `c`, then `d`, then `e`, then `f`, each halving or quartering the remaining interval.
Earlier inserts remain unchanged (`c` stays at the first midpoint) while new points land strictly inside ever smaller windows.
Inserts can target both sides of a midpoint or only the right side; ordering remains intact and seeds never drift.

### Extension Packing

Extensions also work outside the initial segment: placing nodes above the highest seed uses STEP-sized spacing, while placing nodes below the lowest seed uses dyadic interval subdivision.
Dense clusters near a large gap center keep seeds stable.
Mixing outer inserts with inner midpoints leaves fences intact while layering additional nodes between existing seeds.
Packed sibling gaps across multiple regions show that each local interval can be subdivided independently across successive overrides, with later splits narrower than the prior interval.
Cycles throw an exception immediately, ensuring the DAG assumption holds even in extension calls.

## Appendix

### Design Notes

Implementation relies on Kahn topological sorting over all declared pairs plus seeded extras, followed by forward and backward constraint propagation through parent-child edges to derive lower and upper fences.
A constant STEP of 1024 defines initial gaps; the dyadic function (`1 << (31 - clz32(n))`) subdivides intervals during insertion cascades by selecting the largest power-of-two that fits within the available span.
Fence propagation walks the DAG forward for lower bounds and backward for upper bounds, keeping determinism across runs.

### Contributing

Contributions should mirror the existing Vitest suites: pair basics, recursion, inference, topology (three through five nodes), extension stability, density, and packing.
Each scenario should validate ordering, stride constancy, and seed preservation without relying on external fixtures.

### License

MIT
