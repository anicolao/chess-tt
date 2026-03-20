# Project Workflow

All contributors (human and AI) must adhere to the following workflow when executing tasks in this project.

1. **Review Documentation:**
   Begin every task by reading and reviewing all documents in the project root to understand the current architecture and vision.

2. **Branching**:
   - Create a new branch for each task or feature.
   - Branch names should be descriptive (e.g., `feature/chess-logic`, `fix/drag-drop`).

3. **Design First**:
   - Ensure a design document exists for the task (like `MVP_DESIGN.md`).
   - If no existing design covers the current task, create a new design document and commit it **before** implementation.

4. **Pull Requests**:
   - Create PRs using `gh pr create`.
   - The PR description **must** include the **original User Prompt(s)** verbatim and any relevant user comments that initiated the work.
   - **Continuous Prompt Recording**: For every subsequent set of changes on the PR, the agent MUST add a new comment to the PR containing the verbatim text of all new user prompts and instructions received since the last push. **Critically**, this comment must be posted *before* the push so the prompts appear in the PR timeline before the resulting commits. This ensures a logical, chronological, and auditable history.

5. **Iterative Development**:
   - Commit often with descriptive messages.
   - Push frequently to your branch.
   - **Safe CLI Usage**: When passing multi-line strings or Markdown to CLI tools (e.g., `gh pr comment`), always use temporary files or here-documents (`<<'EOF'`) to avoid shell quoting and escaping issues (especially with backticks). Never attempt to pass large blocks of Markdown as a direct command-line argument.

6. **Testing & Validation**:
   - **Unit Tests**: All core logic, especially event sourcing and redux reducers, must have comprehensive unit tests.
   - **E2E Tests**: See `E2E_GUIDE.md`. Playwright tests are mandatory for all features and bug fixes.
   - **Husky Hooks**: The project uses Husky to enforce test passing.
     - **Pre-commit**: Enforces that all unit tests pass before a commit can be created.
     - **Pre-push**: Enforces that the full test suite (including E2E Playwright tests) passes before pushing to GitHub.
   - Validation is mandatory for task completion.

7. **No Reverts**:
   - Do not revert changes unless they cause errors or the user explicitly requests it.
