---
title: HackerRank Git Tasks
description: Speed playbook and worked solutions for terminal-based Git challenges, plus honest notes on how Git fits FAANG online assessments.
sidebar:
  order: 2
---

:::note[Reality check]
FAANG-style HackerRank online assessments are overwhelmingly data structures and algorithms. Git challenges appear mostly in DevOps/SRE/platform-oriented tests and some company-specific screens, typically as a prepared repo in a browser terminal with a goal to reach. Check your invite for the format, and spend most prep time on DSA.
:::

## First 60 seconds

```bash
git status
git branch -a
git log --oneline --graph --decorate --all -20
git remote -v
git stash list
```
Understand the starting state before touching anything.

## Don't get stuck in an editor

```bash
export GIT_EDITOR=true            # accept default messages, no editor opens
git merge --no-edit feature
git commit -m "message"           # always pass -m
git -c core.editor=true rebase --continue
```

If Vim opens: `Esc`, then `:wq` (save) or `:q!` (quit without saving).

## Worked tasks

### 1. Create branch, commit, push
```bash
git switch -c feature/greeting
echo "Hello" > greeting.txt
git add greeting.txt
git commit -m "Add greeting"
git push -u origin feature/greeting
```

### 2. Merge and resolve a conflict
```bash
git switch main
git merge feature/greeting
# CONFLICT in config.yml
```
```bash
# edit config.yml, remove <<<<<<< ======= >>>>>>> and keep the intended result
grep -rn '<<<<<<<\|>>>>>>>' .     # confirm no markers remain
git add config.yml
git commit --no-edit
```

### 3. Squash last N commits without an editor
```bash
git reset --soft HEAD~3
git commit -m "Implement search feature"
```
Same result as an interactive squash, and works in any terminal.

### 4. Rebase a branch onto main
```bash
git switch feature
git rebase main
# on conflict: fix, git add, then
git rebase --continue
```

### 5. Cherry-pick a specific fix into a release branch
```bash
git log --oneline main | grep -i "fix null"
git switch release/1.0
git cherry-pick 7a8b9c0
```

### 6. Undo a pushed commit
```bash
git revert 9c8d7e6 --no-edit
git push
```

### 7. Recover a deleted branch
```bash
git reflog | grep "feature/login"
git branch feature/login a1b2c3d
```

### 8. Change author or message of last commit
```bash
git commit --amend -m "Fix typo in README"
git commit --amend --author="Ada <ada@example.com>" --no-edit
```

### 9. Find which commit introduced a bug
```bash
git bisect start HEAD v1.0
git bisect run ./check.sh
git bisect reset
```

### 10. Move work to a new branch
```bash
git switch -c new-branch           # carries uncommitted changes
git add -A && git commit -m "WIP"
git switch main
git reset --hard origin/main
```
:::danger
Verify `new-branch` has your commit (`git log -1 new-branch`) before `reset --hard`.
:::

## Pitfalls that cost points

| Mistake | Fix |
|---|---|
| Forgot to `git add` new file | `git status` before every commit |
| Committed on wrong branch | `git switch` first, check `git branch --show-current` |
| Left conflict markers | `grep -rn '<<<<<<<' .` |
| Pushed to wrong remote/branch | `git push origin <branch>` explicitly |
| Rebase left in progress | `git status` shows "rebase in progress"; continue or `--abort` |
| Graded on commit count/messages | Follow instructions literally: exact branch and message text |

## Final check before submitting

```bash
git status                         # clean?
git log --oneline --graph --all -10
git diff origin/main --stat        # expected files changed?
git push                           # if the task requires it
```

## FAANG prep split (suggested)

| Area | Share of time |
|---|---|
| DSA + HackerRank coding problems | ~80% |
| System design / past projects | ~15% |
| Git/GitHub fluency (this section) | ~5% (one focused weekend) |