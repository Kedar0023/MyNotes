---
title: "Branching & Merging"
description: Branch, merge, rebase, and resolve conflicts with visual diagrams.
sidebar:
  order: 2
---

## Branch commands

```bash
git switch -c feature/login             # create + switch
git switch main                         # switch to existing
git branch -vv                          # local branches with upstream info
git branch -d feature/login             # delete (only if merged)
git branch -D feature/login             # force delete
git push origin --delete feature/login  # delete remote branch
```

## How branches work

```text
  Branches are just pointers to commits. Creating one = writing a 41-byte file.

  main         feature
    │             │
    ▼             ▼
    A ── B ── C ── D ── E
```

## Merge

```bash
git switch main
git merge feature/login                 # merge into current branch
git merge --no-ff feature/login         # always create merge commit
```

### Fast-forward vs three-way merge

```text
  FAST-FORWARD (main hasn't diverged):

  Before:   A ── B  (main)
                  \
                   C ── D  (feature)

  After:    A ── B ── C ── D  (main, feature)
                              ↑ pointer moved, no new commit

  ─────────────────────────────────────────────────

  THREE-WAY MERGE (main has diverged):

  Before:   A ── B ── C  (main)
                  \
                   D ── E  (feature)

  After:    A ── B ── C ──── M  (main)   ← merge commit
                  \         /
                   D ── E──'
```

### Three-way merge explained

```text
  Git uses 3 inputs:

         merge-base (B)
           /      \
          /        \
    main tip (C)  feature tip (E)

  • Change only in one side  → auto-applied
  • Same change both sides   → auto-applied
  • Different change same lines → CONFLICT
```

## Rebase

Replays your commits on top of another branch, creating new SHAs.

```bash
git switch feature/login
git rebase main                   # replay feature on main
git rebase -i HEAD~4              # interactive: edit/squash/reorder
```

```text
  Before rebase:     A ── B ── C  (main)
                          \
                           D ── E  (feature)

  After rebase:      A ── B ── C  (main)
                                \
                                 D' ── E'  (feature)  ← new SHAs!
```

:::danger
Never rebase commits others already pulled. It rewrites SHAs and forces teammates to reconcile. Use `git push --force-with-lease` (not `--force`) for rewritten history.
:::

## Merge vs rebase

| | Merge | Rebase |
|---|---|---|
| History | Preserves true branching | Linear |
| Rewrites commits | No | Yes (new SHAs) |
| Conflicts | Once | Possibly per commit |
| Safe on shared branches | ✅ Yes | ❌ No |

:::tip[Rule of thumb]
Rebase your **private** feature branch onto `main` before opening a PR. Merge (or squash) into `main`.
:::

## Merge conflicts

Happens when two branches edit the same lines.

```text
  <<<<<<< HEAD
  const timeout = 3000;   ← current branch
  =======
  const timeout = 5000;   ← incoming branch
  >>>>>>> feature
```

**Resolve:** edit file → remove markers → `git add <file>` → `git commit`

```bash
git merge --abort                 # bail out
git checkout --theirs f.js        # take incoming version
grep -rn '<<<<<<' .               # confirm no markers left
```

## Compare branches

```bash
git log main..feature             # commits in feature, not in main
git diff main...feature           # changes since common ancestor
git fetch --prune                 # sync + clean deleted remote refs
```