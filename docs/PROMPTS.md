# Reusable Agent Prompts

Use these prompts with OpenAI Codex, Claude Code, Cursor, or similar coding agents. Replace placeholders before running.

## Universal Work Request

```txt
Read RUN_WORKFLOW.md and execute it using WORK_REQUEST.md.

Follow AGENTS.md.
Ask clarifying questions until about 90% understanding before touching code unless the request says "skip questions".
Generate a saved spec in _spec/, generate a vertical task plan in _task/, execute one Ralph Wiggum-style task at a time, verify, critique/fix, update _progress/progress.md, write a final summary in _summary/, then provide a final response and suggested commit message.
```

## Direct Request With Questions

```txt
Use this as the active request:
<REQUEST>

Follow RUN_WORKFLOW.md.
First ask focused clarifying questions about goal, users, exact behavior, edge cases, UI/API expectations, data model, constraints, success criteria, and out-of-scope work.
Do not touch code until questions are answered, a spec is saved in _spec/, and a task plan is saved in _task/.
```

## Direct Request That Skips Questions

```txt
Use this as the active request:
<REQUEST>

skip questions

Follow RUN_WORKFLOW.md.
Generate a best-effort spec in _spec/ and clearly list assumptions.
Generate a vertical task plan in _task/.
Before implementation, read _progress/progress.md and the latest relevant _summary/ entry.
Then execute tasks one at a time only if safe.
```

## Intake Questions

```txt
Read WORK_REQUEST.md and AGENTS.md.

Ask the fewest focused questions needed to reach about 90% understanding.

Clarify:
1. Goal.
2. Users.
3. Exact behavior.
4. Edge cases.
5. UI expectations.
6. API expectations.
7. Data model expectations.
8. Constraints.
9. Success criteria.
10. Out-of-scope items.

Do not inspect or edit implementation code yet.
```

## Spec Generation

```txt
Using the active request and the answers so far, generate a detailed spec.

Save it in _spec/ with a timestamped or slugged filename, for example:
_spec/2026-05-10-add-dark-theme.md

Include:
- Request summary
- Date
- Source prompt
- Questions asked and answers received
- Assumptions
- Goal
- Non-goals
- Users
- Functional requirements
- UI expectations, if relevant
- API expectations, if relevant
- Data model expectations, if relevant
- Edge cases
- Constraints
- Success criteria
- Out-of-scope items
- Open questions

Do not implement code.
```

## Request Classification

```txt
Read WORK_REQUEST.md and the saved _spec/ file.

Classify the request as one primary type:
- feature
- bugfix
- boilerplate
- security
- refactor
- test
- docs
- ops
- research

Also identify:
1. Scope: small, medium, or large.
2. Risk: low, medium, or high.
3. Whether implementation is allowed after the saved spec and task plan.
4. Whether any open question blocks implementation.
5. The safest first vertical task.

Do not edit implementation files.
```

## Repo Intake

```txt
Inspect the repository for the saved spec in _spec/.

Find:
1. Stack and major frameworks.
2. Package manager and lockfiles.
3. Test, lint, build, and typecheck commands.
4. Folder and naming conventions.
5. Existing architecture boundaries.
6. Files likely affected by the request.
7. Risks, missing tooling, and unknowns.

Update docs/PROJECT_CONTEXT.md with durable findings only.
Do not implement the request yet.
```

## Vertical Task Generation

```txt
Using WORK_REQUEST.md, the saved _spec/ file, _progress/progress.md, the latest relevant _summary/ entry, and durable docs, generate a vertical task plan in _task/.

Each task must include:
- Task ID
- Status
- Objective
- Files likely affected
- Checklist
- Acceptance criteria
- Verification commands
- Stop condition
- Out-of-scope items

Tasks must be vertical slices, not vague layers.
Use Ralph Wiggum-style task phrasing: small, literal, concrete, sequential.

Do not implement code.
```

## Single-Task Execution

```txt
Follow AGENTS.md and RUN_WORKFLOW.md.

Execute exactly one task:
<TASK-ID> - <TASK_TITLE>

Before editing:
- Read _progress/progress.md.
- Read the latest relevant _summary/ entry.
- Read the saved _spec/ file.
- Read the saved _task/ plan.
- Check git status.
- Inspect only relevant files.

After editing:
- Run or recommend verification commands.
- Critique the result.
- Fix only in-scope defects.
- Append to _progress/progress.md with task ID, status, files changed, verification result, blockers, and next step.
- Create or append the relevant _summary/ entry if the workflow stops here.
- Check git status again.

Do not implement any other task.
```

## Ralph Wiggum Task Execution

```txt
Run the current task like a small literal checklist.

For each checklist item:
1. Say what file or behavior you are checking.
2. Make only the change needed for the current item.
3. Stop if the next action would expand scope.
4. Verify the task acceptance criteria.
5. Update _progress/progress.md before moving on.

No bundled refactors.
No second task until this task is verified, critiqued, and logged.
```

## Critique Loop

```txt
Review the active task result as a senior engineer.

Use the saved _spec/ file, saved _task/ plan, _progress/progress.md, and the current diff.

Prioritize:
1. Bugs or regressions.
2. Security issues.
3. Missing acceptance criteria.
4. Missing edge cases.
5. Test gaps.
6. Scope creep.
7. Unnecessary complexity.

Return findings with file and line references where possible.
Fix only defects inside the current task scope.
```

## Verification Repair

```txt
Follow AGENTS.md.

The verification for the active task failed:
<COMMAND>

Failure summary:
<PASTE_FAILURE_SUMMARY>

Fix only the cause of this active-task failure.
Do not refactor unrelated code.

After the fix:
- Re-run the failing command if possible.
- Run directly related tests.
- Append the result to _progress/progress.md.
- Update the final _summary/ entry if the workflow is complete.
- Summarize the root cause and fix.
```

## Final Summary

```txt
Produce the final workflow summary and create or append it in _summary/.

Include:
1. Original work request.
2. Spec file used.
3. Task plan used.
4. Tasks completed.
5. Files changed.
6. Verification commands and results.
7. Unresolved issues or blockers.
8. Recommended next work.
9. Suggested commit message.

Do not claim a commit was made unless one was actually created.
```

## Architecture Review

```txt
Review the saved _spec/ file, docs/PROJECT_CONTEXT.md, and docs/ARCHITECTURE.md for consistency.

Identify:
1. Architecture decisions that are clear.
2. Gaps or contradictions.
3. Over-engineered areas.
4. Missing production concerns.
5. Recommended updates to docs/DECISIONS.md.

Do not implement code.
```

## Reduce Complexity

```txt
Review the implementation of <FEATURE_OR_TASK>.

Goal:
Reduce complexity while preserving behavior.

Constraints:
- Do not change public APIs.
- Do not change user-visible behavior.
- Do not introduce dependencies.
- Keep changes small and reviewable.

First propose the simplification plan.
Wait for approval before editing.
```

## Prepare Commit

```txt
Prepare a commit summary for the completed task <TASK-ID>.

Include:
1. Suggested commit message.
2. Files changed.
3. Behavior changed.
4. Verification run.
5. Known risks or follow-up tasks.

Do not run git commit unless explicitly instructed.
```

## Generate Changelog

```txt
Generate a changelog entry for the changes since <BASE_REF>.

Group by:
- Added
- Changed
- Fixed
- Removed
- Security

Keep it concise and user-facing.
```

## Generate Demo Summary

```txt
Create a short demo summary for <FEATURE_OR_RELEASE>.

Include:
1. What was built.
2. The main user workflow.
3. What to show in a demo.
4. Known limitations.
5. Suggested next improvement.
```
