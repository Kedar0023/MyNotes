---
title: Bitwise Patterns for Coding Problems
description: Recognition table and solutions for the classic LeetCode/HackerRank bit problems - XOR tricks, counting, masks, and arithmetic with bits.
sidebar:
  order: 2
---

Each pattern: signal, template, and the LeetCode problems it solves. Basics are in [Bitwise Basics](./basics/).

## Signal to technique

| Signal in the problem | Think |
|---|---|
| "every element appears twice except one" | XOR everything |
| "appears 3 times except one" | per-bit count mod 3 |
| "O(1) extra space", "no `+`", "without arithmetic" | XOR / AND / shifts |
| "power of two / four" | `x & (x - 1)` |
| "number of 1 bits", "Hamming" | Kernighan / `bit_count` |
| n ≤ 20 and subsets / assignments | bitmask, see [Bitmask and Subsets](./bitmask-subsets/) |
| "subarray XOR", "XOR queries" | prefix XOR |
| "maximum XOR pair" | binary trie |
| "sum over all pairs of AND/OR/XOR" | count per bit independently |
| values < 2^k, "set of characters" | one int as a set |

## XOR cancellation

### Single Number (136)

```python
from functools import reduce
from operator import xor

def single_number(nums):
    return reduce(xor, nums)
```

### Missing Number (268)

XOR indices `0..n` with all values; pairs cancel, the missing one survives.

```python
def missing_number(nums):
    r = len(nums)
    for i, v in enumerate(nums):
        r ^= i ^ v
    return r
```

`Find the Difference (389)` is the same idea: XOR all chars of both strings.

### Single Number III (260): two singles

```python
def single_number_iii(nums):
    x = reduce(xor, nums)        # x = a ^ b, nonzero
    low = x & -x                 # a bit where a and b differ
    a = b = 0
    for v in nums:
        if v & low: a ^= v
        else:       b ^= v
    return [a, b]
```

Partitioning by one differing bit puts `a` and `b` in different groups; each group is a Single Number problem.

### Single Number II (137): once vs three times

Two ways. Trade-off: per-bit counting is easy to derive and generalizes to "k times"; the state machine is O(1) space and branch-free but harder to recall. Prefer per-bit counting in interviews.

```python
def single_number_ii(nums):          # per-bit count mod 3
    res = 0
    for b in range(32):
        cnt = sum(v >> b & 1 for v in nums) % 3
        res |= cnt << b
    return res if res < 1 << 31 else res - (1 << 32)   # signed fix
```

```python
def single_number_ii_fsm(nums):      # ones/twos state machine
    ones = twos = 0
    for v in nums:
        ones = (ones ^ v) & ~twos
        twos = (twos ^ v) & ~ones
    return ones
```

## Counting bits

### Number of 1 Bits (191), Kernighan

Loops once per set bit instead of once per bit.

```python
def popcount(n):
    c = 0
    while n:
        n &= n - 1
        c += 1
    return c
```

### Counting Bits (338): popcount for 0..n

```python
def count_bits(n):
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i & (i - 1)] + 1     # or dp[i >> 1] + (i & 1)
    return dp
```

### Hamming Distance (461) and Total Hamming Distance (477)

```python
def hamming(x, y):
    return (x ^ y).bit_count()

def total_hamming(nums):                 # O(32 n), not O(n^2)
    n = len(nums)
    total = 0
    for b in range(32):
        ones = sum(v >> b & 1 for v in nums)
        total += ones * (n - ones)       # pairs that differ at bit b
    return total
```

## Powers of two and four

```python
def is_pow2(x):  return x > 0 and x & (x - 1) == 0           # 231
def is_pow4(x):  return is_pow2(x) and x & 0x55555555 != 0   # 342: bit at even index
def is_pow3(x):  return x > 0 and 1162261467 % x == 0        # 326: 3^19 is the largest int32 power
```

## Bit manipulation of representation

### Reverse Bits (190)

```python
def reverse_bits(n):
    r = 0
    for _ in range(32):
        r = (r << 1) | (n & 1)
        n >>= 1
    return r
```

### Number Complement (476)

```python
def complement(n):
    return n ^ ((1 << n.bit_length()) - 1)
```

### Gray Code (89)

Adjacent values differ in one bit.

```python
def gray_code(n):
    return [i ^ (i >> 1) for i in range(1 << n)]
```

```python
gray_code(2)   # [0, 1, 3, 2]
```

### Bitwise AND of Numbers Range (201)

The AND of a range is the common binary prefix of the endpoints.

```python
def range_and(left, right):
    while right > left:
        right &= right - 1       # strip lowest set bit until they meet
    return right
```

```python
range_and(26, 30)   # 24   (11010 .. 11110 -> 11000)
```

## Arithmetic without `+`

### Sum of Two Integers (371)

XOR is add-without-carry; `(a & b) << 1` is the carry. Repeat until no carry.

```python
def add(a, b):
    M = 0xFFFFFFFF
    while b:
        a, b = (a ^ b) & M, ((a & b) << 1) & M
    return a if a <= 0x7FFFFFFF else ~(a ^ M)
```

:::caution
In Python the mask is mandatory, otherwise negative inputs loop forever. In Java/C++ drop the masks; `int` wraps naturally.
:::

### Divide Two Integers (29) idea

Subtract the largest `divisor << k` that fits, add `1 << k` to the quotient, repeat. O(log² n). Handle `INT_MIN / -1` overflow separately.

```python
def divide(a, b):
    if a == -2**31 and b == -1:
        return 2**31 - 1
    neg = (a < 0) != (b < 0)
    a, b = abs(a), abs(b)
    q = 0
    for k in range(31, -1, -1):
        if (a >> k) >= b:
            a -= b << k
            q += 1 << k
    return -q if neg else q
```

## Sets of small items as masks

### Maximum Product of Word Lengths (318)

Lowercase letters fit in 26 bits. Two words share no letter iff masks AND to zero.

```python
def max_product(words):
    masks = [(sum(1 << ord(c) - 97 for c in set(w)), len(w)) for w in words]
    best = 0
    for i in range(len(masks)):
        for j in range(i):
            if masks[i][0] & masks[j][0] == 0:
                best = max(best, masks[i][1] * masks[j][1])
    return best
```

### Minimum Flips to Make a OR b = c (1318)

Judge each bit independently.

```python
def min_flips(a, b, c):
    flips = 0
    for i in range(32):
        x, y, z = a >> i & 1, b >> i & 1, c >> i & 1
        if z: flips += (x | y) == 0
        else: flips += x + y
    return flips
```

## Quick checklist

- Pairs cancel, one survivor: XOR.
- Two survivors: XOR then split on `x & -x`.
- Fixed-width constraint: mask with `0xFFFFFFFF` in Python.
- Counting over all pairs: loop bits, not pairs.
- Comparisons of `&` results need parentheses outside Python.
