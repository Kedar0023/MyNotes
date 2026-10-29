---
title: Bitwise Basics and Tricks
description: Operators, bit get/set/clear, the one-liner tricks, and language gotchas needed for LeetCode and HackerRank bit problems.
sidebar:
  order: 1
---

Examples are Python 3.10+. Java/C++ differences are in [Language gotchas](#language-gotchas).

## Operators

| Op | Name | Example | Result |
|---|---|---|---|
| `a & b` | AND | `0b1100 & 0b1010` | `0b1000` |
| `a \| b` | OR | `0b1100 \| 0b1010` | `0b1110` |
| `a ^ b` | XOR | `0b1100 ^ 0b1010` | `0b0110` |
| `~a` | NOT | `~5` | `-6` (`-a - 1`) |
| `a << k` | Shift left | `3 << 2` | `12` (`a * 2^k`) |
| `a >> k` | Shift right | `13 >> 2` | `3` (`a // 2^k`, floors for negatives) |

XOR laws you will use constantly:

```python
a ^ a == 0          # cancels itself
a ^ 0 == a          # identity
a ^ b == b ^ a      # commutative, associative: order does not matter
```

## Single-bit operations

```python
(x >> i) & 1        # get bit i
x | (1 << i)        # set bit i
x & ~(1 << i)       # clear bit i
x ^ (1 << i)        # toggle bit i
(x & ~(1 << i)) | (v << i)   # write v (0/1) into bit i
(1 << n) - 1        # mask of n ones (0b111...1)
x & ((1 << k) - 1)  # keep lowest k bits (x mod 2^k)
```

## Tricks table

| Goal | Expression | Example (`x = 0b101100`) |
|---|---|---|
| Is odd | `x & 1` | `0` |
| Isolate lowest set bit | `x & -x` | `0b000100` |
| Clear lowest set bit | `x & (x - 1)` | `0b101000` |
| Set lowest zero bit | `x \| (x + 1)` | `0b101101` |
| Isolate lowest zero bit | `~x & (x + 1)` | `0b000001` |
| Clear trailing ones | `x & (x + 1)` | `0b101100` |
| Power of two | `x > 0 and x & (x - 1) == 0` | `False` |
| Index of lowest set bit | `(x & -x).bit_length() - 1` | `2` |
| Index of highest set bit | `x.bit_length() - 1` | `5` |
| Clear highest set bit | `x ^ (1 << (x.bit_length() - 1))` | `0b001100` |
| Popcount | `x.bit_count()` (3.10+) / `bin(x).count("1")` | `3` |
| Next power of two ≥ x (x ≥ 1) | `1 << (x - 1).bit_length()` | `64` |
| Swap without temp | `a ^= b; b ^= a; a ^= b` | |
| Opposite signs | `(a ^ b) < 0` | |
| Floor average, no overflow | `(a & b) + ((a ^ b) >> 1)` | |
| Flip all bits in n-bit window | `x ^ ((1 << n) - 1)` | |

Why `x & (x - 1)` works: subtracting 1 flips the lowest set bit and every zero below it, so the AND wipes exactly that bit.

```text
x      = 1011 1000
x - 1  = 1011 0111
x&(x-1)= 1011 0000   <- lowest set bit gone
```

## Negative numbers and two's complement

`-x == ~x + 1`. Hence `x & -x` isolates the lowest set bit.

```python
~5         # -6
-5 & 0xFF  # 251  -> low 8 bits of -5
bin(-5 & 0xFF)  # '0b11111011'
```

:::caution[Python integers are unbounded]
There is no 32-bit overflow in Python. `~x` and `<<` never wrap. When a problem expects 32-bit behavior, mask manually:

```python
MASK = 0xFFFFFFFF
x &= MASK                              # force into unsigned 32-bit
x if x <= 0x7FFFFFFF else ~(x ^ MASK)  # reinterpret as signed 32-bit
```
:::

## Precedence

Python order, tightest first: `+ -` → `<< >>` → `&` → `^` → `|` → comparisons.

```python
1 << n - 1        # == 1 << (n - 1), NOT (1 << n) - 1
x & 1 == 0        # OK in Python: (x & 1) == 0
x | 1 << i        # OK: x | (1 << i)
```

:::caution
In C, C++ and Java, `==` binds tighter than `&`, `^`, `|`. Write `(x & 1) == 0` there. Always parenthesize when switching languages.
:::

## Language gotchas

| Topic | Python | Java | C++ |
|---|---|---|---|
| Int width | unbounded | 32-bit `int`, 64-bit `long` | 32-bit `int`, use `long long` |
| Logical right shift | `(x & MASK) >> k` | `>>>` | cast to `unsigned` first |
| Popcount | `x.bit_count()` | `Integer.bitCount(x)` | `__builtin_popcount(x)` / `popcountll` |
| Highest bit | `x.bit_length() - 1` | `31 - Integer.numberOfLeadingZeros(x)` | `31 - __builtin_clz(x)` |
| Lowest bit idx | `(x & -x).bit_length() - 1` | `Integer.numberOfTrailingZeros(x)` | `__builtin_ctz(x)` |
| 64-bit literal | `1 << 40` | `1L << 40` | `1LL << 40` |

:::danger
Java/C++: `1 << 31` overflows signed `int`, and `1 << 32` is undefined behavior in C++ (shift count ≥ width). Use `1L` / `1LL` for masks over 31 bits.
:::

## Binary and hex conversion

```python
bin(10)            # '0b1010'
format(10, "08b")  # '00001010'  zero-padded
int("1010", 2)     # 10
hex(255)           # '0xff'
int("ff", 16)      # 255
```

## Cost model

All bit operations are O(1) for word-size ints. In Python, ints larger than a machine word cost O(n / 64) per op, which still makes big-int bitsets very fast (see [Advanced techniques](./bitwise-advanced/)).

## Where next

- Classic problems: [Bitwise Patterns](./bitwise-patterns/)
- Subsets, bitmask DP, N-Queens: [Bitmask and Subsets](./bitmask-subsets/)
- Prefix XOR, tries, per-bit counting: [Advanced Techniques](./bitwise-advanced/)