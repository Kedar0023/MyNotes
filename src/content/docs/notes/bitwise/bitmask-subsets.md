---
title: Bitmask, Subsets and Bitmask DP
description: Represent sets as integers, enumerate subsets and submasks, and solve n ≤ 20 problems with bitmask DP, BFS over masks, and bit-trick N-Queens.
sidebar:
  order: 3
---

Use when `n ≤ 20` (sometimes ≤ 24) and the state is "which items are chosen/visited". Operator basics are in [Bitwise Basics](./basics/).

## Set operations on ints

Bit `i` set means element `i` is in the set.

| Operation | Expression |
|---|---|
| Empty / full set of n | `0` / `(1 << n) - 1` |
| Contains i | `m >> i & 1` |
| Add / remove / toggle i | `m \| 1 << i` / `m & ~(1 << i)` / `m ^ 1 << i` |
| Union / intersection | `a \| b` / `a & b` |
| Difference `a \ b` | `a & ~b` |
| Complement in n-set | `full ^ m` |
| Size | `m.bit_count()` |
| `a` subset of `b` | `a & b == a` |
| Disjoint | `a & b == 0` |

## Iterating

### All subsets of n items

```python
for mask in range(1 << n):
    subset = [i for i in range(n) if mask >> i & 1]
```

Total O(2^n · n). Subsets (78) and Subsets II (90, sort and dedupe) are direct applications.

### Set bits of a mask

```python
m = mask
while m:
    low = m & -m
    i = low.bit_length() - 1     # index of this set bit
    m ^= low
```

### All submasks of a mask (3^n over all masks)

```python
sub = mask
while sub:
    # use sub
    sub = (sub - 1) & mask
# handle sub == 0 (empty submask) separately if needed
```

```python
# mask = 0b1011 -> 1011, 1010, 1001, 1000, 0011, 0010, 0001, (0)
```

### All k-element subsets in increasing order (Gosper's hack)

```python
def next_combo(x):
    c = x & -x
    r = x + c
    return (((r ^ x) >> 2) // c) | r

x = (1 << k) - 1                # k >= 1
while x < (1 << n):
    # use x
    x = next_combo(x)
```

```python
# n=4, k=2 -> 0b0011, 0b0101, 0b0110, 0b1001, 0b1010, 0b1100
```

## Feasibility by constraint

| n | Complexity that fits |
|---|---|
| ≤ 12 | `3^n` submask loops |
| ≤ 20 | `2^n · n` |
| ≤ 16 | `2^n · n^2` (TSP) |
| ≤ 24 | `2^n` only, tight memory |

## Bitmask DP

Template: `dp[mask]` = best result using exactly the items in `mask`. Transition by adding one item not in `mask`.

### Partition to K Equal Sum Subsets (698)

`dp[mask]` = current fill of the open bucket (mod target), or `-1` if unreachable.

```python
def can_partition_k(nums, k):
    s = sum(nums)
    if s % k:
        return False
    t = s // k
    if max(nums) > t:
        return False
    n = len(nums)
    dp = [-1] * (1 << n)
    dp[0] = 0
    for m in range(1 << n):
        if dp[m] < 0:
            continue
        for i in range(n):
            if not m >> i & 1 and dp[m] + nums[i] <= t:
                dp[m | 1 << i] = (dp[m] + nums[i]) % t
    return dp[-1] == 0
```

Same shape: Matchsticks to Square (473), Fair Distribution of Cookies (2305), Minimum Number of Work Sessions (1986, with a session cap instead of `t`).

### Can I Win (464): game DP on used numbers

```python
from functools import cache

def can_i_win(max_choosable, target):
    if target <= 0:
        return True
    if max_choosable * (max_choosable + 1) // 2 < target:
        return False

    @cache
    def win(used, rem):
        for i in range(max_choosable):
            b = 1 << i
            if used & b:
                continue
            if i + 1 >= rem or not win(used | b, rem - i - 1):
                return True
        return False

    return win(0, target)
```

The remaining total is determined by `used`, so memoizing on `used` alone is enough; `rem` is carried for convenience.

### Travelling-salesman shape: `dp[mask][last]`

```python
def tsp(dist):
    n = len(dist)
    INF = float("inf")
    dp = [[INF] * n for _ in range(1 << n)]
    dp[1][0] = 0                          # start at city 0, visited {0}
    for m in range(1 << n):
        for last in range(n):
            if dp[m][last] == INF:
                continue
            for nxt in range(n):
                if m >> nxt & 1:
                    continue
                nm = m | 1 << nxt
                dp[nm][nxt] = min(dp[nm][nxt], dp[m][last] + dist[last][nxt])
    full = (1 << n) - 1
    return min(dp[full][i] + dist[i][0] for i in range(n))
```

O(2^n · n^2) time. Problems with this layout: Shortest Superstring (943), Beautiful Arrangement (526), Number of Squareful Arrays (996).

### BFS over (node, mask): Shortest Path Visiting All Nodes (847)

When edges are unweighted, BFS beats DP. Start from every node at once.

```python
from collections import deque

def shortest_path_length(graph):
    n = len(graph)
    full = (1 << n) - 1
    q = deque((i, 1 << i) for i in range(n))
    seen = set(q)
    d = 0
    while q:
        for _ in range(len(q)):
            u, m = q.popleft()
            if m == full:
                return d
            for v in graph[u]:
                s = (v, m | 1 << v)
                if s not in seen:
                    seen.add(s)
                    q.append(s)
        d += 1
    return 0
```

### Cover problems: Smallest Sufficient Team (1125), Max Length of Unique-Character Concatenation (1239)

Compress each item to a mask of what it covers or uses, then DP over the union.

```python
def max_length(arr):                       # 1239
    masks = [0]                            # reachable char-set masks
    best = 0
    for w in arr:
        m = 0
        for c in w:
            m |= 1 << ord(c) - 97
        if m.bit_count() != len(w):        # word has duplicate letters
            continue
        for old in masks[:]:
            if old & m == 0:
                masks.append(old | m)
                best = max(best, (old | m).bit_count())
    return best
```

### Row masks: Maximum Students Taking Exam (1349)

Row-by-row DP where `dp[row][mask]` is valid if `mask & (mask >> 1) == 0` (no adjacent seats) and compatible with broken seats and the previous row:

```python
# adjacent in same row:  mask & (mask >> 1)
# upper-left / upper-right: mask & (prev << 1)  and  mask & (prev >> 1)
```

## Backtracking with masks: N-Queens (51/52)

Three int masks replace three sets: columns, `\` diagonals, `/` diagonals. Shifting the diagonal masks each row tracks which columns they attack.

```python
def total_n_queens(n):
    full = (1 << n) - 1

    def go(cols, d1, d2):
        if cols == full:
            return 1
        cnt = 0
        avail = full & ~(cols | d1 | d2)
        while avail:
            p = avail & -avail             # pick lowest free column
            avail ^= p
            cnt += go(cols | p, ((d1 | p) << 1) & full, (d2 | p) >> 1)
        return cnt

    return go(0, 0, 0)
```

```python
total_n_queens(8)   # 92
```

## Sum over Subsets (SOS DP)

`f[mask] = sum of g[sub] for all sub ⊆ mask` in O(n · 2^n) instead of O(3^n).

```python
def sos(g, n):
    f = g[:]
    for i in range(n):
        for m in range(1 << n):
            if m >> i & 1:
                f[m] += f[m ^ 1 << i]
    return f
```

Use for "count pairs/triples whose AND is zero / a submask of X". Example: Triples with Bitwise AND Equal To Zero (982) counts `cnt[x & y]` over pairs, then for each `z` sums `cnt[sub]` over submasks of `~z`.

## Pitfalls

:::caution
- Loop order matters in SOS DP: the bit loop is the **outer** loop.
- `range(1 << n)` with n = 25+ in Python is too slow and memory-heavy; consider meet-in-the-middle (split into two halves of n/2).
- In TSP-style DP, initialize unreachable states to `INF`, not `0`, or `min` silently picks them.
:::
