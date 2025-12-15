Guide the user through an interactive release process for the MillerNav plugin.

Follow these steps:

1. Ask for version number (format: X.Y.Z)
2. Verify prerequisites (jq, gh CLI, git status)
3. Update version files (manifest.json, package.json)
4. Build the plugin
5. Package artifacts and create ZIP
6. Generate checksums
7. Create git commit and tag
8. Ask to push to GitHub
9. Create GitHub release
10. Provide Obsidian Community Plugin submission instructions

Be interactive - ask questions, wait for user confirmation before destructive operations (push, release), and provide clear explanations at each step.
