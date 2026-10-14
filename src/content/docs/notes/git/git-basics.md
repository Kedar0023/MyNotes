---
title: Git Basics
description: Core Git commands for daily work, from first install to pushing code.
sidebar:
  order: 1
---

## Three areas (how Git tracks your work)

```text
  Working Directory       Staging Area (Index)       Repository (.git)
  ┌─────────────────┐     ┌─────────────────┐       ┌─────────────────┐
  │                 │     │                 │       │                 │
  │  modified files │──add──>  staged snap  │──commit──>  permanent   │
  │                 │     │   shot          │       │  history        │
  │                 │     │                 │       │                 │
  └─────────────────┘     └─────────────────┘       └─────────────────┘
          ▲                                                 │
          └──────────── git restore / checkout ─────────────┘
```

- **Working directory** — files on disk you edit.
- **Staging area (index)** — snapshot of what the next commit will contain.
- **Repository** — the full commit history inside `.git/`.

:::tip
The staging area lets you commit *part* of your changes. Use `git add -p` to stage individual hunks.
:::

## One-time setup

```bash
git config --global user.name "Ada Lovelace"
git config --global user.email "ada@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase true      # pull = fetch + rebase
git config --global core.editor "code --wait"
git config --global --list
```

## Start a repo

```bash
git init                                  # new repo in current dir
git clone https://github.com/torvalds/linux.git
git clone --depth 1 <url>                 # shallow: latest commit only
```

## Daily loop

```bash
git status
git add src/app.py           # stage one file
git add -p                   # stage hunks interactively
git commit -m "Fix off-by-one in pagination"
git push
```

| Command | Purpose |
|---|---|
| `git add .` | Stage everything under current dir (respects `.gitignore`) |
| `git commit -am "msg"` | Stage + commit **tracked** files only (new files skipped) |
| `git commit --amend` | Rewrite the last commit |
| `git rm --cached f` | Stop tracking `f`, keep it on disk |
| `git mv a b` | Rename and stage |

:::tip[Commit message shape]
Imperative, under 50 chars: `Add retry to payment client`. Body explains **why**, not what.
:::

## Inspect

```bash
git diff                     # unstaged changes
git diff --staged            # staged changes
git log --oneline --graph --decorate --all
git log -p -- src/app.py     # history of one file with patches
git show a1b2c3d             # one commit
git blame -L 10,20 src/app.py
```

```text title="git log --oneline output"
e4f5a6b (HEAD -> main, origin/main) Add retry to payment client
9c8d7e6 Fix off-by-one in pagination
3b2a1c0 Initial commit
```

## HEAD and refs

```text
  HEAD ───► refs/heads/main ───► e4f5a6b (commit object)
```

- **HEAD** — pointer to the current branch (or directly to a commit when detached).
- **Branch** — a file containing a commit hash. Creating one is O(1).
- **Detached HEAD** — `HEAD` points to a commit hash directly, not a branch.
- **Remote-tracking ref** (`origin/main`) — last known remote state, updated by `fetch`.

```bash
cat .git/HEAD                    # ref: refs/heads/main
cat .git/refs/heads/main         # e4f5a6b...
```

## Remotes

```bash
git remote -v                                # view remotes
git remote add origin git@github.com:ada/project.git
git fetch --prune                            # download + clean deleted refs
git pull                                     # fetch + merge (or rebase)
git push -u origin main                      # first push: set upstream
git push                                     # later pushes
```

:::note
`origin` is the conventional name for the main remote. `-u` links your local branch to a remote branch so later you can just `git push`.
:::

## .gitignore

```gitignore title=".gitignore"
node_modules/
.env
*.log
dist/
.DS_Store
```

:::caution
`.gitignore` does not affect files already tracked. Run `git rm --cached <file>` first.
:::

## Tags

```bash
git tag -a v1.0.0 -m "First release"   # annotated (preferred)
git push origin v1.0.0                 # tags aren't pushed by default
git tag                                # list
git tag -d v1.0.0                      # delete local
git push origin --delete v1.0.0        # delete remote
```