# MillerNav Release Quick Reference

## Prerequisites Checklist

- [ ] GitHub CLI installed: `gh --version`
- [ ] jq installed: `jq --version`
- [ ] gh authenticated: `gh auth status`
- [ ] Clean working directory: `git status`
- [ ] Build succeeds: `cd miller_nav && npm run build`

---

## Quick Release (Automated)

```bash
# Using Claude Code
/release

# Or directly
./scripts/release.sh 1.0.0
```

---

## Manual Release (5 Steps)

```bash
VERSION="1.0.0"

# 1. Update versions
# Edit manifest.json and package.json manually

# 2. Build
cd miller_nav && npm run build && cd ..

# 3. Package
mkdir -p "releases/version${VERSION}"
cp miller_nav/build/{main.js,manifest.json,styles.css} "releases/version${VERSION}/"
cd "releases/version${VERSION}" && zip "miller-nav-${VERSION}.zip" main.js manifest.json styles.css && cd ../..

# 4. Checksum
cd "releases/version${VERSION}" && sha256sum * > SHA256SUMS && cd ../..

# 5. Release
git add . && git commit -m "Release v${VERSION}"
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin main && git push origin "v${VERSION}"
gh release create "v${VERSION}" --title "v${VERSION}" \
  "releases/version${VERSION}/miller-nav-${VERSION}.zip" \
  "releases/version${VERSION}/SHA256SUMS"
```

---

## Rollback

```bash
./scripts/release.sh rollback 1.0.0
```

Or manually:
```bash
VERSION="1.0.0"
git tag -d "v${VERSION}"
git push origin --delete "v${VERSION}"
gh release delete "v${VERSION}" --yes
git reset --hard HEAD~1
```

---

## Submit to Obsidian

1. Fork: https://github.com/obsidianmd/obsidian-releases
2. Add to `community-plugins.json`:
   ```json
   {
     "id": "miller-nav",
     "name": "Miller Nav",
     "author": "Your Name",
     "description": "Multi-pane hierarchical navigation using Miller columns",
     "repo": "yourusername/obsidian_miller_nav"
   }
   ```
3. Create pull request
4. Wait for review

---

## Version Numbering

```
MAJOR.MINOR.PATCH

1.0.0 → 1.0.1  (Bug fixes)
1.0.1 → 1.1.0  (New features)
1.1.0 → 2.0.0  (Breaking changes)
```

---

## Common Issues

| Error | Solution |
|-------|----------|
| jq not found | `brew install jq` or `sudo apt install jq` |
| gh not found | `brew install gh` or visit cli.github.com |
| Not authenticated | `gh auth login` |
| Tag exists | `git tag -d v1.0.0 && git push origin --delete v1.0.0` |
| Uncommitted changes | `git add . && git commit` or `git stash` |

---

## File Locations

```
miller_nav/
├── manifest.json          ← Version here
├── package.json           ← Version here
└── build/                 ← Build output
    ├── main.js
    ├── manifest.json
    └── styles.css

releases/
└── version1.0.0/          ← Release artifacts
    ├── main.js
    ├── manifest.json
    ├── styles.css
    ├── miller-nav-1.0.0.zip
    └── SHA256SUMS

scripts/
└── release.sh             ← Release script

.claude/
├── commands/
│   └── release.md         ← /release command
└── skills/
    └── release.md         ← Release skill
```

---

## Verification

```bash
# Test ZIP
unzip -t releases/version1.0.0/miller-nav-1.0.0.zip

# Verify checksums
cd releases/version1.0.0 && sha256sum -c SHA256SUMS

# Check release
gh release view v1.0.0
```

---

## Post-Release Checklist

- [ ] GitHub release created
- [ ] ZIP file uploaded
- [ ] Checksums verified
- [ ] Tag pushed to GitHub
- [ ] Release appears on GitHub
- [ ] Submitted to obsidian-releases (if first time)
- [ ] Announcement posted
- [ ] Documentation updated
