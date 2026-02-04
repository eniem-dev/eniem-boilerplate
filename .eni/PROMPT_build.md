# Build Mode

You are in BUILD mode. Implement one task from beads, validate, and commit.

**Epic filter:** `{{EPIC_NAME}}` (empty = all ready tasks)

## Phase 0: Branch Setup

Before any work, ensure correct branch:

**If epic specified (`{{EPIC_NAME}}`):**
```bash
# Check if on feature branch for this epic
EXPECTED_BRANCH="feat/{{EPIC_NAME}}"
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]; then
  # Create and checkout feature branch if it doesn't exist
  git checkout -b "$EXPECTED_BRANCH" 2>/dev/null || git checkout "$EXPECTED_BRANCH"
fi
```

**If no epic (building all):**
```bash
# Create dated build branch
BUILD_BRANCH="build-$(date +%Y%m%d)"
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "$BUILD_BRANCH" ]; then
  git checkout -b "$BUILD_BRANCH" 2>/dev/null || git checkout "$BUILD_BRANCH"
fi
```

## Phase 1: Check Ready Tasks

```bash
bd ready
```

**If epic specified:** Only consider tasks matching `{{EPIC_NAME}}` in their title or notes.

If no ready tasks:
1. Run `bd blocked` to see what's waiting
2. If ALL tasks for this epic/scope are complete → go to **Phase 5: Create PR**
3. Otherwise, output `:::ENI_ALL_TASKS_COMPLETE:::` and exit

## Phase 2: Select & Claim Task

Pick the highest priority ready task (filtered by epic if specified):

```bash
bd show <task-id>
bd update <task-id> --status=in_progress
```

Read the task's description, design, and notes fields.

Before making changes, search the codebase to:
- Verify functionality doesn't already exist
- Understand existing patterns
- Identify files to modify

## Phase 3: Implement & Validate

Implement following:
- The design field in the bead
- Patterns in `CLAUDE.md`
- Existing code conventions

After implementing, validate:
1. Run `Verify:` command from task notes - must pass
2. Run `pnpm build` - must pass
3. Run `pnpm lint` - must pass

If validation fails, fix and re-validate. Do NOT proceed until passing.

## Phase 4: Commit & Close

When validation passes:

```bash
git add -A
git commit -m "feat: [task description]"
bd close <task-id>
git push -u origin HEAD
```

Exit - the loop will restart for the next task.

## Phase 5: Create PR

When no ready tasks remain for this epic/scope:

1. Verify all tasks are closed:
   ```bash
   bd list --status=open  # Should show no tasks for this epic
   ```

2. Create pull request:
   ```bash
   gh pr create --title "feat: {{EPIC_NAME}}" --body "$(cat <<'EOF'
   ## Summary
   Implementation of {{EPIC_NAME}} epic.

   ## Changes
   [List main changes]

   ## Test plan
   - [ ] Verified build passes
   - [ ] Verified lint passes
   EOF
   )"
   ```

3. Output completion signal:
   ```
   :::ENI_ALL_TASKS_COMPLETE:::
   ```

## Error Recovery

If validation fails:
1. First attempt: Targeted fix based on error
2. Second attempt: Alternative approach
3. Third attempt:
   - Create blocking bug: `bd create --type=bug --title="Fix: [error]"`
   - Do NOT commit broken code
   - Exit

## Guardrails

1. **Branch first** — ensure correct branch before any work
2. **Single task** — implement ONE task per iteration
3. **Epic filter** — only work on tasks matching epic if specified
4. **Validate before commit** — never commit failing code
5. **Close beads** — always `bd close` after committing
6. **PR at end** — create PR when no tasks remain

## Command Reference

```bash
# Find work
bd ready              # Show unblocked tasks
bd blocked            # Show blocked tasks
bd show <id>          # Task details

# Claim work
bd update <id> --status=in_progress

# Complete work
bd close <id>         # Mark done

# Git
git checkout -b feat/<epic-name>
gh pr create --title "..." --body "..."
```
