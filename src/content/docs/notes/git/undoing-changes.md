---
title: Undoing Changes
description: "Symptom-to-fix guide for discarding, reverting, resetting, and recovering in Git."
sidebar:
  order: 3
---

## Quick reference

| Want to undo | Command |
|---|---|
| Unstaged edits to a file | `git restore file` |
| `git add` (unstage) | `git restore --staged file` |
| Last commit message / forgotten file | `git commit --amend` |
| Last commit, keep changes staged | `git reset --soft HEAD~1` |
| Last commit, keep changes unstaged | `git reset HEAD~1` |
| A pushed commit (safe) | `git revert <sha>` |
| Everything, back to remote | `git reset --hard origin/main` |

## reset modes

```text
  git reset --soft HEAD~2          (moves HEAD only)
  git reset       HEAD~2           (moves HEAD + resets index)
  git reset --hard HEAD~2          (moves HEAD + resets index + working tree)

              HEAD~2    HEAD~1    HEAD
                │                  │
                ▼                  ▼
        ── A ── B ── C ──── D ──── E
                │
                └── HEAD moves here

  ┌────────────┬──────────┬───────────┬──────────────┐
  │    Mode    │   HEAD   │  Staged   │ Working Tree │
  ├────────────┼──────────┼───────────┼──────────────┤
  │  --soft    │ moves ◄  │   kept    │     kept     │
  │  --mixed   │ moves ◄  │  reset    │     kept     │
  │  --hard    │ moves ◄  │  reset    │   DELETED    │
  └────────────┴──────────┴───────────┴──────────────┘
```

:::danger
`git reset --hard` and `git restore <file>` permanently discard uncommitted changes. They are **not** in the reflog.
:::

## Common scenarios

### Committed to the wrong branch

```bash
git switch correct-branch
git cherry-pick wrong-branch      # copy the commit
git switch wrong-branch
git reset --hard HEAD~1           # remove it here
```

### Wrong commit message

```bash
git commit --amend -m "Correct message"
```

### Pushed a bad commit to shared branch

Use `revert` — it adds a new commit, keeping history intact.

```bash
git revert a1b2c3d
git revert -m 1 <merge-sha>       # reverting a merge: pick mainline parent
git push
```

### Lost commits after reset --hard

Commits survive ~90 days in the reflog.

```bash
git reflog
# 9c8d7e6 HEAD@{2}: commit: Add search
git reset --hard 9c8d7e6
# or
git switch -c rescue 9c8d7e6
```

### Rebase went wrong

```bash
git rebase --abort                 # still in progress
git reset --hard ORIG_HEAD         # already finished
```

### Force-pushed over teammate's work

Prevent it:
```bash
git push --force-with-lease        # fails if remote has unseen commits
```

### Committed a secret

1. **Rotate the secret first.** Assume it's compromised.
2. Remove from history:

```bash
pip install git-filter-repo
git filter-repo --path .env --invert-paths
git push --force-with-lease --all
```

### Detached HEAD

```bash
git switch -c my-work             # keep the commits
git switch main                   # or discard them
```