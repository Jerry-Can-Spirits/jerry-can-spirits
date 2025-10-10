# Contributing to Jerry Can Spirits

## Git Workflow & Branching Strategy

### Branch Structure

We use a simplified Git Flow workflow with the following branches:

- **`main`** - Production-ready code. Protected branch.
- **`dev`** - Development branch. All features merge here first.
- **`feature/*`** - Feature branches for new work.
- **`bugfix/*`** - Bug fix branches.
- **`hotfix/*`** - Emergency fixes for production.

### Branch Protection

The `main` branch is protected with the following rules:
- Requires pull request reviews before merging
- Blocks force pushes
- Blocks deletions
- Requires conversation resolution

## Development Workflow

### Starting New Work

1. **Ensure you're on the latest dev branch:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

   Branch naming conventions:
   - `feature/add-sitemap` - New features
   - `bugfix/fix-navigation-mobile` - Bug fixes
   - `hotfix/security-patch` - Emergency production fixes

3. **Make your changes and commit regularly:**
   ```bash
   git add .
   git commit -m "Add descriptive commit message"
   ```

4. **Push your feature branch:**
   ```bash
   git push -u origin feature/your-feature-name
   ```

### Creating a Pull Request

1. **Push your branch to GitHub** (if not already done)
2. **Go to GitHub** and create a Pull Request
3. **Set the base branch:**
   - For features/bugfixes: PR to `dev`
   - For hotfixes: PR to `main` (emergency only)
4. **Fill out the PR template:**
   - Description of changes
   - Testing performed
   - Screenshots (if UI changes)
5. **Request review** from team members
6. **Address feedback** and push new commits
7. **Merge** once approved (use "Squash and merge" for clean history)

### After Merge

1. **Delete your feature branch:**
   ```bash
   git branch -d feature/your-feature-name
   git push origin --delete feature/your-feature-name
   ```

2. **Update your local dev:**
   ```bash
   git checkout dev
   git pull origin dev
   ```

### Releasing to Production

When `dev` is stable and ready for production:

1. **Create a PR from `dev` to `main`**
2. **Title it:** "Release v1.x.x - [Brief description]"
3. **Include in description:**
   - List of features/fixes included
   - Testing checklist
   - Deployment notes
4. **Get approval** from project owner
5. **Merge to main** (creates automatic deployment)
6. **Tag the release:**
   ```bash
   git checkout main
   git pull origin main
   git tag -a v1.x.x -m "Release version 1.x.x"
   git push origin v1.x.x
   ```

## Commit Message Guidelines

Use clear, descriptive commit messages following this format:

```
<type>: <subject>

<body (optional)>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat: Add XML sitemap generation

fix: Resolve mobile navigation keyboard trap

docs: Update README with deployment instructions

refactor: Simplify header component logic
```

## Code Review Guidelines

### For Authors
- Keep PRs focused and reasonably sized
- Write clear descriptions
- Add tests for new features
- Update documentation as needed
- Respond to feedback promptly

### For Reviewers
- Review within 24-48 hours when possible
- Be constructive and specific
- Test the changes locally when needed
- Approve only when ready for production

## Testing Requirements

Before creating a PR:
- ✅ Run `npm run lint` (no errors)
- ✅ Run `npm run build` (successful build)
- ✅ Test functionality locally
- ✅ Check responsive design (mobile/tablet/desktop)
- ✅ Verify accessibility (keyboard navigation, screen reader)
- ✅ Check browser compatibility

## Emergency Hotfixes

For critical production issues:

1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue-name
   ```

2. **Make the fix and test thoroughly**

3. **Create PR to main** with "HOTFIX" in title

4. **After merge to main, also merge to dev:**
   ```bash
   git checkout dev
   git merge main
   git push origin dev
   ```

## Questions?

Contact the development team or create an issue on GitHub.

---

**Last Updated:** October 2025
