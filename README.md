# landing-pages

Static landing pages for [paulolinhares-mrcoder.com.br](https://www.paulolinhares-mrcoder.com.br).

## Repository workflow

Default branch: **`master`**.

When the user asks to create a branch and open a PR on GitHub, follow this sequence.

### 1. Prepare the branch

```bash
git status
git diff && git diff --staged
git branch -vv
git log --oneline -10
```

- Create the branch from the current commit (use the name the user gives, e.g. `feature/privicy-policy`).
- Do **not** commit on `master` when the work belongs in a feature branch.
- If changes are already committed on `master` locally, create the feature branch from that commit, push it, then reset local `master` to `origin/master`:

```bash
git checkout -b feature/your-branch-name
git push -u origin feature/your-branch-name
git checkout master
git reset --hard origin/master
git checkout feature/your-branch-name
```

### 2. Push and create the PR

Use the GitHub CLI (`gh`) when available:

```bash
git push -u origin HEAD
gh pr create --base master --head feature/your-branch-name \
  --title "Short title" \
  --body "$(cat <<'EOF'
## Summary
- ...

## Test plan
- [ ] ...
EOF
)"
```

Return the PR URL to the user.

### 3. If `gh` is not installed or not authenticated

This environment often has **SSH push working** but **no `gh` auth** (`gh auth login` or `GH_TOKEN` required for the API).

1. Push the branch via SSH (usually works).
2. Try installing `gh` to a temp path if missing, or use an existing install.
3. If auth still fails, open a pre-filled compare URL so the user can click **Create pull request**:

```bash
open "https://github.com/PauloLinhares09/landing-pages/compare/master...feature/your-branch-name?quick_pull=1&title=URL_ENCODED_TITLE&body=URL_ENCODED_BODY"
```

4. Verify whether the PR exists:

```bash
curl -s "https://api.github.com/repos/PauloLinhares09/landing-pages/pulls?head=PauloLinhares09:feature/your-branch-name&state=open"
```

Do **not** push to `master` unless the user explicitly asks. Do **not** force-push.

### 4. Commit and PR conventions

- Only commit when the user asks.
- PR title: short, describes the *why* (e.g. "Add privacy policy page for Digital Twin Market landing").
- PR body: `## Summary` (bullets) + `## Test plan` (checkboxes).
- Remote: `git@github.com:PauloLinhares09/landing-pages.git`

## Project layout

| Path | Purpose |
|------|---------|
| `digital_twin_market/raiz_page_no_video.html` | Main Maquete Digital landing page |
| `digital_twin_market/institucional/` | Institutional pages (e.g. privacy policy) |
| `digital_twin_market/assets/` | Images, video, OG assets |
| `sitemap.xml` | Site URLs for SEO |

Site domain: `https://www.paulolinhares-mrcoder.com.br`
