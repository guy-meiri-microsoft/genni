# Claude Rules for Genni Project

## Git Branching Workflow

### Rule: Always Ask About Branch Creation

**Before starting work on any new task, MUST ask the user:**
> "Should I create a new branch for this task?"

**Branch Naming Convention:**
```
username/task-name-in-kebab-case
```

**Examples:**
- `dtoledano/add-floating-navigation`
- `dtoledano/fix-date-parsing-bug`
- `dtoledano/update-mock-toggle-behavior`

**Workflow:**
1. User requests a new task
2. Claude asks: "Should I create a new branch for this task?"
3. If yes:
   - Ask for username if not known
   - Confirm branch name: `username/task-name`
   - Create branch: `git checkout -b username/task-name`
4. If no:
   - Proceed on current branch

**Exceptions (don't ask):**
- User explicitly mentions working on current branch
- Task is trivial (typo fix, comment update)
- User is already in the middle of a task on a feature branch

## Commit Message Guidelines

**Format:**
```
<Brief summary (50 chars or less)>

<Detailed description of changes>

Key changes:
- Bullet point 1
- Bullet point 2
- Bullet point 3

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Co-author Attribution:**
- Always include co-author line unless user explicitly requests removal
- Use email: `noreply@anthropic.com`

## Build Commands

**Always use the correct build command:**
- For extension builds: `npm run build:extension`
- For development builds: `npm run build`
- Never use just `npm run build` when testing the extension

## Code Style

**TypeScript:**
- Explicit return types for public functions
- Avoid `any`, prefer `unknown` with type guards
- Named function exports for components

**React:**
- Hooks at component top level
- Destructure props in function signature
- Use optional chaining for nested properties

**CSS:**
- Component-specific CSS files
- Use CSS variables for all design tokens
- No inline styles except for dynamic values

## Todo List Management

**When to use TodoWrite:**
- Complex tasks with multiple steps (3+)
- User provides multiple tasks
- Non-trivial implementations requiring planning

**When NOT to use TodoWrite:**
- Single trivial tasks
- Purely conversational requests
- Simple file reads or searches
