---
name: release
description: Automate the complete release process for MillerNav Obsidian plugin including version updates, building, packaging, tagging, and GitHub release creation. Use when the user asks to create a release, publish a new version, or wants to release the plugin to GitHub.
---

# Release Automation Skill

Automates the complete release workflow for the MillerNav Obsidian plugin.

## When to Use This Skill

Use this skill when:
- User asks to "create a release"
- User wants to "publish a new version"
- User says "release version X.Y.Z"
- User asks to "prepare for GitHub release"
- User wants to "package the plugin for distribution"

## What This Skill Does

1. **Version Management**: Updates version numbers in `manifest.json` and `package.json`
2. **Build Process**: Runs the production build (`npm run build`)
3. **Artifact Creation**: Creates versioned directory `releases/version{X}/` with:
   - `main.js` (bundled JavaScript)
   - `manifest.json` (plugin metadata)
   - `styles.css` (compiled CSS)
   - `miller-nav-{X}.zip` (distribution archive)
4. **Checksum Generation**: Creates SHA256 checksums for verification
5. **Git Operations**: Commits changes, creates annotated tag, pushes to GitHub
6. **GitHub Release**: Creates release with uploaded artifacts

## Instructions

### Step 1: Ask for Version Number

Ask the user what version number they want to release. Validate it follows semantic versioning format: `MAJOR.MINOR.PATCH` (e.g., 1.0.0, 0.5.3, 2.1.0).

**Example prompt:**
```
What version number would you like to release? (e.g., 1.0.0)
```

### Step 2: Check Prerequisites

Verify these prerequisites are met:
- GitHub CLI (`gh`) is installed and authenticated
- `jq` is installed for JSON manipulation
- Git working directory is clean (no uncommitted changes)

If prerequisites are missing, inform the user and provide installation instructions from `docs/RELEASE.md`.

### Step 3: Execute Release Script

Run the release script with the version number:
```bash
./scripts/release.sh {VERSION}
```

**Monitor the script output for:**
- Version updates confirmation
- Build success
- Artifact creation
- Checksum generation
- Git tag creation
- GitHub release URL

### Step 4: Handle Errors

If the script encounters errors:
1. Read the error message carefully
2. Inform the user about the issue
3. Provide specific troubleshooting steps
4. Offer to run rollback if needed: `./scripts/release.sh rollback {VERSION}`

**Common issues:**
- `jq not found` → User needs to install jq
- `gh not authenticated` → User needs to run `gh auth login`
- `Uncommitted changes` → User needs to commit or stash changes
- `Tag already exists` → Tag needs to be deleted first

### Step 5: Report Success

After successful release, display:
- GitHub release URL
- Local artifacts location (`releases/version{X}/`)
- Next steps for submitting to Obsidian community plugins

### Step 6: Guide Obsidian Submission

Provide instructions for submitting to Obsidian Community Plugins:

1. **Fork the repository**: https://github.com/obsidianmd/obsidian-releases

2. **Add entry to community-plugins.json**:
```json
{
  "id": "miller-nav",
  "name": "Miller Nav",
  "author": "{USER_NAME}",
  "description": "Multi-pane hierarchical navigation for Obsidian vaults using Miller columns",
  "repo": "{GITHUB_USERNAME}/obsidian_miller_nav"
}
```

3. **Create pull request** to obsidian-releases repository

4. **Wait for review** from Obsidian team (may take several days)

## Release Directory Structure

Each release creates this structure:
```
releases/
└── version{X}/
    ├── main.js                   # Bundled JavaScript
    ├── manifest.json             # Plugin metadata
    ├── styles.css                # Compiled CSS
    ├── miller-nav-{X}.zip       # Distribution archive
    ├── SHA256SUMS                # Checksums file
    └── RELEASE_NOTES.md          # Release notes
```

## Rollback Procedure

If something goes wrong and the user wants to rollback:

```bash
./scripts/release.sh rollback {VERSION}
```

This will:
- Delete local git tag
- Delete remote git tag
- Delete GitHub release
- Revert the release commit

## Examples

### Example 1: First Release

**User:** "I want to create the first release"

**Your response:**
```
I'll help you create the first release for MillerNav. What version number would you like to use?
For a first release, I recommend version 1.0.0.
```

**After user provides version:**
```
Great! I'll create release v1.0.0. Let me first check the prerequisites...
[Check prerequisites]
[Run release script]
[Report results]
```

### Example 2: Bug Fix Release

**User:** "Release version 1.0.1 with bug fixes"

**Your response:**
```
I'll create release v1.0.1 for bug fixes. Let me run the release process...
[Execute release workflow]
```

### Example 3: Error Handling

**User:** "Create release 2.0.0"

**Script error:** "jq: command not found"

**Your response:**
```
The release process failed because jq is not installed.

To fix this:
- On macOS: brew install jq
- On Ubuntu/Debian: sudo apt install jq
- On Fedora: sudo dnf install jq

After installing jq, I can retry the release.
```

## Best Practices

1. **Always validate version format** before running the script
2. **Check git status** to ensure clean working directory
3. **Monitor script output** for any errors or warnings
4. **Verify checksums** are generated correctly
5. **Test ZIP extraction** before finalizing release
6. **Provide clear next steps** after successful release

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| jq not found | Install jq: `brew install jq` or `sudo apt install jq` |
| gh not found | Install GitHub CLI from https://cli.github.com/ |
| Not authenticated | Run `gh auth login` |
| Tag exists | Delete existing tag: `git tag -d v{X} && git push origin --delete v{X}` |
| Uncommitted changes | Commit or stash changes first |
| Build fails | Check npm dependencies: `cd miller_nav && npm install` |
| Invalid version | Use MAJOR.MINOR.PATCH format (e.g., 1.0.0) |

## Related Documentation

- **Complete Guide**: [docs/RELEASE.md](../../docs/RELEASE.md)
- **Quick Reference**: [docs/RELEASE_QUICK_REF.md](../../docs/RELEASE_QUICK_REF.md)
- **Release Script**: [scripts/release.sh](../../scripts/release.sh)

## Notes

- The `releases/` directory is in `.gitignore` and won't be committed to git
- Artifacts are stored locally and uploaded to GitHub Releases
- The script automatically creates git tags with `v` prefix (e.g., v1.0.0)
- Release notes can be provided interactively or use default template
- Checksums are generated using SHA256 algorithm
