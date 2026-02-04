# Build Mode

You are in BUILD mode. Implement one task from beads, validate, and commit.

## Phase 0: Startup

Before any work:

1. Run `bd ready` to see available tasks
2. If no ready tasks, run `bd blocked` to see what's waiting
3. Check git status - abort if uncommitted changes exist
4. Run `pnpm build` to verify clean state

## Phase 0.5: Orient

Use parallel Task tools (subagent_type=Explore) to study:

- `specs/*` — application specifications
- `CLAUDE.md` — project conventions and patterns
- `src/*` — application source code (for reference)

## Phase 1: Select & Claim Task

Pick the highest priority ready task:

```bash
bd ready
bd show <task-id>
bd update <task-id> --status=in_progress
```

Read the task's description, design, and notes fields for implementation guidance.

Before making changes, search the codebase (don't assume not implemented) to:

- Verify the functionality doesn't already exist
- Understand existing patterns in related code
- Identify all files that need creation/modification

## Phase 2: Implement

Implement the task following:

- The design field in the bead
- Patterns in `CLAUDE.md`
- Existing code conventions

Use parallel Task tools for file reads and searches. Run build/test commands directly (not via subagent).

## Phase 3: Validate

After implementing:

1. Run the `Verify:` command from the task's notes field - must pass
2. Run `pnpm build` - must pass
3. Run `pnpm lint` - must pass

If validation fails, fix and re-validate. Do NOT proceed until validation passes.

## Phase 4: Commit & Close

When validation passes:

1. Create a focused commit:
   ```bash
   git add -A
   git commit -m "feat: [task description]"
   ```

2. Close the bead:
   ```bash
   bd close <task-id>
   ```

3. Push changes:
   ```bash
   git push
   ```

4. Exit - the loop will restart for the next task.

## Error Recovery

If validation fails:

1. First attempt: Targeted fix based on error
2. Second attempt: Alternative approach
3. Third attempt:
   - Create a blocking issue: `bd create --type=bug --title="Fix: [error]"`
   - Link it: `bd dep add <original-task> <bug-id>`
   - Do NOT commit broken code
   - Exit

## Session End Protocol

Before ending any session:

```bash
bd sync --from-main    # Pull beads updates from main
git status             # Verify all committed
```

## Guardrails

1. **Single task** — implement ONE task per iteration
2. **Search first** — don't assume not implemented
3. **Validate before commit** — never commit failing code
4. **Direct commands** — run build/tests directly, not via subagent
5. **Follow patterns** — use `CLAUDE.md` over introducing new ones
6. **Close beads** — always `bd close` after committing
7. **Exit after commit** — fresh context for next iteration

## Exit Conditions

- Task completed and committed → Exit normally
- Validation failing after 3 attempts → Exit with error, do NOT commit
- No ready tasks remaining → Output completion signal and exit

IMPORTANT: When `bd ready` returns no tasks (all work complete), output exactly:

```
:::ENI_ALL_TASKS_COMPLETE:::
```

This signals the loop to stop. Do NOT output this if any tasks remain.

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

# Sync
bd sync --from-main   # Pull beads from main branch
```
