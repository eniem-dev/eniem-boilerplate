# Planning Mode: Spec → Beads

You are in PLANNING mode. Translate a spec into beads epics and issues.

**Spec:** `specs/{{SPEC_NAME}}.md`
**Iteration:** {{ITERATION}}

---

## Iteration 1: Create Beads

If this is iteration 1, create the epic and all issues.

### Step 1: Read the Spec

Read `specs/{{SPEC_NAME}}.md` and extract:
- Problem statement (WHY)
- User stories (WHAT users can do)
- Data model (entities, relationships)
- UI/UX flows (screens, interactions)
- Acceptance criteria (verification)

### Step 2: Check for Duplicates

```bash
bd list --status=open
bd list --type=epic
```

Skip if beads already exist for this spec.

### Step 3: Create Epic

```bash
bd create --type=epic \
  --title="{{SPEC_NAME}}: [One-line summary]" \
  --description="Implementation of specs/{{SPEC_NAME}}.md" \
  --priority=2
```

Note the epic ID (e.g., `beads-001`).

### Step 4: Create Issues

For each logical work unit, create an issue:

```bash
bd create --type=task \
  --title="[Action verb] [specific deliverable]" \
  --description="[What to implement]" \
  --design="Files: [paths]
Pattern: [reference existing code]
Edge cases: [from spec]" \
  --notes="Verify: [command]
Epic: [epic-id]" \
  --priority=2
```

**Task granularity:** Each task should take ~2 minutes. If longer, break it down.

**Standard structure:**
1. First issue: Create branch `feat/{{SPEC_NAME}}`
2. Schema issues: Data model changes
3. Backend issues: Queries, actions, handlers
4. Frontend issues: Components, pages
5. Last issue: Create PR (depends on all others)

### Step 5: Add Dependencies

```bash
bd dep add <issue> <depends-on>
```

Patterns:
- Schema → API → UI
- Utils → features using them
- All work → PR issue

### Step 6: Output Summary

```markdown
## Beads Created for: {{SPEC_NAME}}

**Epic:** [id] - [title]

### Issues ([count])

| ID | Title | Priority | Blocked By |
|----|-------|----------|------------|
| ... | ... | ... | ... |

### Dependency Graph

[ascii tree showing dependencies]

### Ready to Start

bd ready shows:
- [id]: [title]
```

---

## Iteration 2+: Refine Beads

If iteration > 1, review and improve existing beads.

### Step 1: Load Current State

```bash
bd list --status=open
bd show <epic-id>
```

### Step 2: Refinement Checklist

Review each issue against the spec:

- [ ] All user stories have corresponding issues?
- [ ] Acceptance criteria captured in descriptions?
- [ ] Dependencies model correct build order?
- [ ] Tasks are atomic (~2 min each)?
- [ ] Design fields have enough detail?
- [ ] Verification commands are testable?

### Step 3: Update Issues

For issues needing improvement:

```bash
bd update <id> --design="[improved details]"
bd update <id> --description="[clarified scope]"
bd update <id> --notes="[better verification]"
```

Split large tasks:
```bash
bd create --type=task --title="[subtask 1]" ...
bd create --type=task --title="[subtask 2]" ...
bd dep add <subtask-2> <subtask-1>
```

### Step 4: Output Changes

```markdown
## Refinement Pass {{ITERATION}}

### Updated Issues
- [id]: [what changed]

### Added Issues
- [id]: [why added]

### Remaining Concerns
- [any issues that still need work]
```

### Step 5: Check if Done

If no meaningful improvements can be made, output:

```
:::ENI_PLAN_REFINED:::
```

This signals the loop to stop early.

---

## Guardrails

1. **DO NOT implement** — only create/update beads
2. **DO NOT use TodoWrite** — beads is the tracker
3. **~2 minute tasks** — break down larger work
4. **Check duplicates** — scan beads before creating
5. **Branch first, PR last** — standard git workflow

## Command Reference

```bash
# Create
bd create --type=epic|task|bug --title="..." --priority=2
bd create --type=task --description="..." --design="..." --notes="..."

# Update
bd update <id> --design="..." --description="..." --notes="..."

# Dependencies
bd dep add <issue> <depends-on>

# View
bd list --status=open
bd ready
bd blocked
bd show <id>
```
