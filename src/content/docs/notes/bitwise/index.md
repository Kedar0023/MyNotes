---
title: "Bitwise Notes"
description: "Quick-reference bitwise concepts, patterns, and advanced XOR/DP techniques for coding interviews and problem solving."
sidebar:
  order: 0
---

| # | Note | What you'll revise |
|---|---|---|
| 1 | [Bitwise Basics](./basics/) | Operators, masks, signed behavior, bit tricks, and Python gotchas |
| 2 | [Bitwise Patterns](./bitwise-patterns/) | Recognition table for XOR, counting, and arithmetic-with-bits problems |
| 3 | [Bitmask, Subsets and Bitmask DP](./bitmask-subsets/) | Set-as-int encoding, subset enumeration, DP over masks, and BFS over state |
| 4 | [Advanced Bitwise Techniques](./bitwise-advanced/) | Prefix XOR, binary tries, OR/AND windows, big-int bitsets, and Nim |

## Quick checklist

- Start with bit identities and masks before trying pattern matching.
- Use XOR for cancellation and prefix comparisons.
- For `n ≤ 20`, model state as a bitmask.
- For max XOR, range queries, and per-bit counting, prefer tries or counting logic.
