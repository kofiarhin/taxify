# Task Memory

Store vertical task plans in this folder.

Agents must create a saved task plan here before implementation. Use filenames that match the related spec when practical, for example:

```txt
_task/2026-05-10-add-dark-theme.md
```

Default execution mode is `complete-workflow`: after the task plan is created, execute all generated tasks sequentially until the request/spec is complete or a stop condition is reached.

Execution modes:

- `plan-only`: ask questions, write spec, write task plan, then stop.
- `single-task`: execute only the next ready task, verify and review it, update artifacts, then stop.
- `complete-workflow`: execute all generated tasks sequentially until the request/spec is complete or a stop condition is reached.

Use `single-task` only when the user explicitly asks for controlled one-task execution.

Each task must include:

- Task ID.
- Status.
- Objective.
- Files likely affected.
- Checklist.
- Acceptance criteria.
- Acceptance result.
- Verification commands.
- Stop condition.
- Out-of-scope items.

## Task Status Transitions

Every task must move through:

```txt
Planned -> Ready -> In Progress -> Verified -> Reviewed -> Done
```

Allowed terminal states:

- `Done`
- `Blocked`
- `Needs Human Review`

Rules:

- A task cannot be `Done` unless verification was attempted and the task was reviewed.
- A task cannot move to `Reviewed` unless verification was attempted.
- If verification cannot run, the task can be `Needs Human Review`, not `Done`.
- A task cannot be `Done` unless every required acceptance criterion is checked `[x]`.
- If any acceptance result is `[ ]` or `[~]`, the task must be `Blocked` or `Needs Human Review`.

Acceptance results use:

```md
Acceptance result:
- [x] Criterion met
- [ ] Criterion not met
- [~] Partially met with notes
```

Copy or summarize acceptance results in `_progress/progress.md`.

Tasks should be Ralph Wiggum-style: small, literal, sequential, and easy to verify.

Continue to the next task automatically only when the current task is `Done`. Stop if a task is `Blocked`, `Needs Human Review`, fails verification, becomes risky or unclear, or requires external access.

## Dirty Worktree Protection

Before implementation, run:

```bash
git status --short
```

Document existing dirty files, files planned for the workflow, and overlap risk. If dirty files overlap with planned files, stop and ask before editing. If dirty files are unrelated, continue but document them. Never overwrite user changes or clean/reset files unless explicitly instructed.

## Failure Recovery

When verification fails, identify the failing command, capture the error, classify the failure as in-scope or unrelated, fix only in-scope failures, rerun the exact failing command, and stop with `Needs Human Review` if targeted recovery cannot prove the task.
