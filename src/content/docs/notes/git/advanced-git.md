---
title: Advanced Git
description: "Stash, cherry-pick, bisect, interactive rebase, worktrees, hooks, and large-repo tools."
sidebar:
  order: 5
---

## Stash

Shelve uncommitted changes to switch context without committing.

```bash
git stash push -m "wip: search UI"
git stash -u                      # include untracked files
git stash list
git stash pop                     # apply + drop
git stash apply stash@{1}         # apply, keep in stash
```

```text
  Working tree ──stash push──> stash stack
       ▲                           │
       └──────── stash pop ────────┘
```

## Cherry-pick

Copy specific commits to the current branch.

```bash
git cherry-pick a1b2c3d
git cherry-pick -x a1b2c3d        # append "(cherry picked from ...)"
git cherry-pick A^..B             # range, inclusive
git cherry-pick -n a1b2c3d        # apply without committing
```

```text
  main:      A ── B ── C
  release:   X ── Y ── Z ── C'    ← cherry-picked C
```

## Interactive rebase

Clean up commit history before merging.

```bash
git commit --fixup a1b2c3d        # mark a fix for an earlier commit
git rebase -i --autosquash main
```

```text title="rebase todo"
pick   a1b2c3d Add search endpoint
fixup  d4e5f6a fixup! Add search endpoint   ← squashed into above
reword 7a8b9c0 Add tests                    ← edit message
drop   1f2e3d4 Debug logging                ← removed
```

| Keyword | Effect |
|---|---|
| `pick` | Keep commit as-is |
| `reword` | Keep commit, edit message |
| `squash` | Meld into previous, combine messages |
| `fixup` | Meld into previous, discard this message |
| `drop` | Delete commit |

## Bisect

Binary search to find the commit that broke something. O(log n) steps.

```bash
git bisect start
git bisect bad                    # current is broken
git bisect good v1.4.0
# Git checks out midpoint → test → mark good/bad
git bisect run ./test.sh          # automate (exit 0 = good)
git bisect reset
```

```text
  good                                     bad
   │                                        │
   ▼                                        ▼
   A ── B ── C ── D ── E ── F ── G ── H ── I
                       ▲
                  midpoint: test this
                  (halves search space each step)
```

## Search history

```bash
git log -S "retryCount"           # commits that added/removed this string
git log -G "timeout\s*=\s*\d+"    # regex on diff lines
git log --follow -- src/app.py    # across renames
git log --author=ada --since=2.weeks --oneline
git blame -L 10,20 -w src/app.py  # -w ignore whitespace
```

## Worktrees

Check out multiple branches simultaneously in separate directories.

```bash
git worktree add ../hotfix hotfix/1.2
git worktree list
git worktree remove ../hotfix
```

:::tip
Use worktrees instead of stashing when a hotfix interrupts your work.
:::

## Hooks

Scripts that run at Git events (commit, push, etc.).

```bash title=".githooks/pre-commit"
#!/bin/sh
npm run lint-staged || exit 1
```

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks   # share hooks via the repo
```

:::note
Hooks are local and skippable (`--no-verify`). Enforce rules in CI too.
:::

## Large repos

```bash
git clone --filter=blob:none <url>        # partial clone: blobs on demand
git clone --depth 1 <url>                 # shallow
git sparse-checkout set services/payments # only check out one dir
git maintenance start                     # background gc/commit-graph
```

## Useful config

```bash
git config --global rerere.enabled true    # remember conflict resolutions
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global fetch.prune true       # auto-prune on fetch
```