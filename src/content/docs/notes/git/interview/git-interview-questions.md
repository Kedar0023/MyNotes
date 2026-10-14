---
title: Git Interview Questions
description: Conceptual and scenario Git/GitHub questions for SDE interviews with concise answers.
sidebar:
  order: 1
---

:::note
At FAANG, Git is rarely a standalone round. It shows up in behavioral/team-process questions, infra/DevOps/SRE loops, and implicitly through how you describe code review and releases. Know the fundamentals cold; don't over-invest beyond them.
:::

## Fundamentals

### Merge vs rebase?
Merge keeps true history with a merge commit; rebase replays commits onto a new base for linear history, creating new SHAs. Rebase private branches, merge shared ones.

### Fetch vs pull?
`fetch` updates remote-tracking refs only. `pull` = `fetch` + `merge` (or `rebase` with `pull.rebase true`).

### Reset vs revert?
`reset` moves the branch pointer (rewrites history; local only). `revert` adds a new commit that undoes a prior one (safe for pushed commits).

### Reset modes?

```text
  --soft    HEAD moves    staged: KEPT      working tree: KEPT
  --mixed   HEAD moves    staged: RESET     working tree: KEPT       (default)
  --hard    HEAD moves    staged: RESET     working tree: DELETED
```

```bash
git reset --soft HEAD~1    # undo commit, keep changes staged
git reset HEAD~1           # undo commit, keep changes unstaged
git reset --hard HEAD~1    # undo commit, delete changes
```

:::danger
`--hard` permanently deletes uncommitted changes. Recover committed work with `git reflog`.
:::

### What is HEAD?
A pointer to the current branch (or directly to a commit when detached).

### What is the staging area?
The index: the proposed next commit's snapshot. Lets you commit part of your changes.

### Is a commit a diff or a snapshot?
Snapshot (a tree of blobs). Diffs are computed on demand.

### What does `git stash` do?
Shelves uncommitted changes on a stack so you can switch context.

### Fast-forward merge?
Target branch has no new commits, so Git just moves the pointer; no merge commit.

### `.gitignore` not working?
File is already tracked. Fix: `git rm --cached <file>`.

## Deeper questions

### How does Git store data?
Content-addressed objects (blob, tree, commit, tag), hashed with SHA-1, deduplicated and packed with delta compression.

```text
  commit ──► tree ──► blob (file contents)
    │          └────► tree (subdirectory) ──► blob
    │
    └──► parent commit(s)
```

### Why is branching cheap?
A branch is a 41-byte file holding a commit hash. Creating/deleting is O(1).

### How do you recover a deleted branch / lost commit?
`git reflog` → find the SHA → `git switch -c rescue <sha>`.

### How do you remove a committed secret?
Rotate it first, then `git filter-repo --path .env --invert-paths` and force-push. Anyone who cloned still has it.

### `--force` vs `--force-with-lease`?
`--force-with-lease` fails if the remote has commits you haven't fetched, so you don't overwrite teammates.

### How does a three-way merge work?

```text
         merge-base
           /    \
          /      \
     tip A      tip B

  • One-sided change     → auto-applied
  • Same change both     → auto-applied
  • Different same lines → CONFLICT
```

### How would you find the commit that introduced a bug?
`git bisect` — binary search, O(log n). Automate with `git bisect run ./test.sh`.

### Squash vs merge commit vs rebase-merge on GitHub?

| Strategy | Result | Use when |
|---|---|---|
| Squash | One commit, clean `main` | Messy WIP commits (default for feature PRs) |
| Merge commit | Full history preserved | Long-lived branches |
| Rebase-merge | Linear, keeps individual commits | Clean, atomic commits |

## Scenario questions

### You pushed a bug to `main` at 5pm. What do you do?
Revert the commit (`git revert`), push, confirm CI/deploy is green, then fix forward with a proper PR and a regression test. Don't rewrite shared history.

### Two teammates edit the same lines — merge conflict. Process?
Pull latest, rebase/merge, open the file, understand both intents (talk to the author if unclear), resolve, run tests, continue. Never pick a side blindly.

### How do you keep a PR reviewable?
Small and single-purpose, descriptive title/body, linked issue, tests, self-review before requesting others.

### Team of 200 on one repo — what scales?
Trunk-based development, short-lived branches, feature flags, CODEOWNERS, required CI, merge queue, partial clone + sparse checkout.

### Explain a release/hotfix process.
Tag release commit (`v1.2.0`), branch `release/1.2` if needed, cherry-pick the fix into the release branch and `main`, tag `v1.2.1`.

## Rapid-fire — commands to know blind

| Task | Command |
|---|---|
| Undo last commit, keep changes | `git reset --soft HEAD~1` |
| Discard local changes to file | `git restore f` |
| Unstage | `git restore --staged f` |
| Squash last 3 | `git rebase -i HEAD~3` |
| See who changed a line | `git blame -L n,m f` |
| Commits in A not B | `git log B..A` |
| Copy one commit | `git cherry-pick <sha>` |
| Find lost commit | `git reflog` |
| Find bug-introducing commit | `git bisect start` |
| Stash with message | `git stash push -m "wip"` |