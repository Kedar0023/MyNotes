---
title: GitHub Essentials
description: "SSH auth, PR flow, forks, gh CLI, and merge strategies for GitHub."
sidebar:
  order: 4
---

## SSH auth

```bash
ssh-keygen -t ed25519 -C "ada@example.com"
cat ~/.ssh/id_ed25519.pub         # add at GitHub > Settings > SSH keys
ssh -T git@github.com             # verify
```

## Feature-branch PR flow

```text
  ┌──────────┐    push     ┌──────────┐   open PR   ┌──────────┐
  │  local   │────────────>│  remote  │────────────>│  review  │
  │  branch  │             │  branch  │             │  & merge │
  └──────────┘             └──────────┘             └──────────┘
       │                                                  │
       │              git fetch + rebase                  │
       └<─────────────── keep in sync ──────────── merged ┘
```

```bash
git switch -c fix/cart-total
# ...edit, commit...
git push -u origin fix/cart-total
gh pr create --fill
```

Update your branch after review or when `main` moves:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

## Fork flow (open source)

```text
  upstream/owner/project  ──fork──>  origin/you/project
          │                                 │
          │  git fetch upstream              │  git push origin
          ▼                                 ▼
       upstream remote              your remote (origin)
          │                                 │
          └──── both tracked in your local clone ────┘
```

```bash
gh repo fork owner/project --clone
cd project
git remote add upstream https://github.com/owner/project.git
git fetch upstream
git switch main && git merge --ff-only upstream/main
```

## gh CLI

| Command | Purpose |
|---|---|
| `gh pr checkout 123` | Check out a PR locally |
| `gh pr list --author @me` | Your open PRs |
| `gh pr review 123 --approve` | Approve |
| `gh pr merge 123 --squash --delete-branch` | Merge |
| `gh run watch` | Follow a workflow run |
| `gh issue create` | New issue |

## Merge strategies (on GitHub)

| Option | Result | Pick when |
|---|---|---|
| Merge commit | Keeps all commits + merge node | Want full history |
| Squash and merge | One commit on `main` | Messy WIP commits (most common) |
| Rebase and merge | Linear, commits kept | Clean, atomic commits |

```text
  Squash merge:

  feature:   A ── B ── C ── D       (4 messy commits)
                                     │
  main:      X ── Y ── Z ── [ABCD]  (1 squashed commit on main)

  ──────────────────────────────────

  Merge commit:

  feature:   A ── B ── C ── D
                              \
  main:      X ── Y ── Z ──── M     (merge node preserves all)
```
