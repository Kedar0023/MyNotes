---
title: Advanced Bitwise Techniques
description: Prefix XOR, per-bit counting, binary tries for max XOR, subarray OR/AND tricks, big-int bitsets, Fenwick lowbit, and Nim.
sidebar:
  order: 4
---

Builds on [Bitwise Basics](./basics/) and [Bitwise Patterns](./bitwise-patterns/).

## Prefix XOR

`p[i] = a[0] ^ ... ^ a[i-1]`, so `xor(a[l..r]) = p[r+1] ^ p[l]`. XOR is its own inverse, which makes it behave like prefix sums.

### XOR Queries of a Subarray (1310)

```python
def xor_queries(arr, queries):
    p = [0]
    for v in arr:
        p.append(p[-1] ^ v)
    return [p[r + 1] ^ p[l] for l, r in queries]
```

### Count subarrays with XOR equal to k

Same shape as Subarray Sum Equals K: `p[j] ^ p[i] == k` means `p[i] == p[j] ^ k`.

```python
from collections import defaultdict

def count_xor_k(arr, k):
    seen = defaultdict(int)
    seen[0] = 1
    p = res = 0
    for v in arr:
        p ^= v
        res += seen[p ^ k]
        seen[p] += 1
    return res
```

### Count Triplets That Can Form Two Arrays of Equal XOR (1442)

`xor(a[i..j-1]) == xor(a[j..k])` iff `xor(a[i..k]) == 0`, and then every `j` in `(i, k]` works.

```python
def count_triplets(arr):
    n, res = len(arr), 0
    for i in range(n):
        x = arr[i]
        for k in range(i + 1, n):
            x ^= arr[k]
            if x == 0:
                res += k - i
    return res
```

O(n²). An O(n) version keeps, per prefix value, a count and a sum of indices.

## Count each bit independently

When the answer is a sum over pairs, subsets, or subarrays of an AND/OR/XOR, bits do not interact. Count how many items have bit `b`, then multiply by `2^b`.

| Task | Per-bit rule |
|---|---|
| Sum of XOR over all pairs | `ones * (n - ones) << b` |
| Sum of XOR totals over all subsets (1863) | if any element has bit `b`, contributes `2^(n-1) << b`, so answer is `(OR of all) << (n - 1)` |
| Sum of OR over all subsets | `(2^n - 2^(n - ones)) << b` (subsets with at least one element that has bit `b`) |
| Sum of AND over all pairs | `C(ones, 2) << b` |

```python
def subset_xor_sum(nums):               # 1863
    total_or = 0
    for v in nums:
        total_or |= v
    return total_or << (len(nums) - 1)
```

```python
subset_xor_sum([5, 1, 6])   # 28
```

## Binary trie: Maximum XOR of Two Numbers (421)

Insert numbers bit by bit from the top. For each number, walk preferring the opposite bit at each level. O(32 · n).

```python
def find_maximum_xor(nums):
    trie = [[0, 0]]                       # node -> [child0, child1]
    for x in nums:
        node = 0
        for b in range(30, -1, -1):
            bit = x >> b & 1
            if not trie[node][bit]:
                trie.append([0, 0])
                trie[node][bit] = len(trie) - 1
            node = trie[node][bit]
    best = 0
    for x in nums:
        node = cur = 0
        for b in range(30, -1, -1):
            bit = x >> b & 1
            if trie[node][bit ^ 1]:
                cur |= 1 << b
                node = trie[node][bit ^ 1]
            else:
                node = trie[node][bit]
        best = max(best, cur)
    return best
```

```python
find_maximum_xor([3, 10, 5, 25, 2, 8])   # 28  (5 ^ 25)
```

Alternative without a trie, using a set of prefixes (O(31 · n), shorter code): for each bit from high to low, tentatively set it in the answer and check whether some pair of prefixes XORs to that candidate.

```python
def find_maximum_xor_set(nums):
    ans = 0
    for b in range(30, -1, -1):
        prefixes = {x >> b for x in nums}
        cand = ans << 1 | 1               # try to make this bit 1
        if any(cand ^ p in prefixes for p in prefixes):
            ans = cand
        else:
            ans <<= 1
    return ans
```

Trade-off: the set version is simpler; the trie extends to variants with constraints (Maximum XOR With an Element From Array (1707) sorts queries offline and inserts numbers up to each limit, Count Pairs With XOR in a Range (1803) stores subtree counts).

## OR / AND over subarrays

Fixing the right end `r`, OR over `a[l..r]` as `l` decreases only gains bits, so there are at most ~32 distinct values. Same for AND losing bits.

### Bitwise ORs of Subarrays (898)

```python
def subarray_ors(arr):
    res, cur = set(), set()
    for x in arr:
        cur = {x} | {x | y for y in cur}
        res |= cur
    return len(res)
```

O(32 · n). Swap `|` for `&` for AND variants.

### Sliding window with OR needs bit counts

OR and AND are not invertible, so you cannot "remove" an element. Keep a count of set elements per bit and rebuild the value on removal.

Shortest Subarray With OR at Least K (3095 / 3097):

```python
def minimum_subarray_length(nums, k):
    if k == 0:
        return 1
    cnt = [0] * 32
    cur = 0
    ans = float("inf")
    l = 0
    for r, x in enumerate(nums):
        for b in range(32):
            if x >> b & 1:
                cnt[b] += 1
        cur |= x
        while cur >= k:
            ans = min(ans, r - l + 1)
            y = nums[l]
            l += 1
            for b in range(32):
                if y >> b & 1:
                    cnt[b] -= 1
                    if cnt[b] == 0:
                        cur &= ~(1 << b)
    return ans if ans < float("inf") else -1
```

This works because OR only grows as the window grows, so `cur >= k` is monotone in window size.

## Big-int bitsets (Python)

A Python int is a free arbitrary-width bitset. Shift-and-OR replaces an inner DP loop with one word-parallel operation.

### Partition Equal Subset Sum (416)

Bit `s` of `dp` means "sum `s` is reachable".

```python
def can_partition(nums):
    total = sum(nums)
    if total % 2:
        return False
    dp = 1
    for x in nums:
        dp |= dp << x
    return dp >> (total // 2) & 1 == 1
```

Same trick: Subset Sum, Last Stone Weight II (1049), Target Sum (494) variants where you only need reachability.

## Lowbit in Fenwick trees

`i & -i` is the size of the range that cell `i` covers.

```python
class Fenwick:
    def __init__(self, n):
        self.t = [0] * (n + 1)

    def add(self, i, v):                 # 1-indexed
        while i < len(self.t):
            self.t[i] += v
            i += i & -i

    def query(self, i):                  # sum of 1..i
        s = 0
        while i > 0:
            s += self.t[i]
            i -= i & -i
        return s
```

## Nim and XOR games

In Nim, the player to move wins iff the XOR of all pile sizes (the nim-sum) is nonzero.

```python
from functools import reduce
from operator import xor

def first_player_wins(piles):
    return reduce(xor, piles) != 0
```

Related: Chalkboard XOR Game (810). Use it when "players alternately take from independent piles".

## Pitfalls

:::caution
- Prefix-XOR hash maps must seed `seen[0] = 1`, or subarrays starting at index 0 are missed.
- Binary trie depth: start at bit 30 for values < 2^31 (covers 10^9); start at bit 62 for values up to 10^18. Match the loop to the constraint.
- Sliding window on AND/OR needs per-bit counters; naive "undo" with XOR or subtraction is wrong.
:::
