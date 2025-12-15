Execute the automated release workflow for MillerNav plugin:

1. Ask the user for the version number (e.g., 1.0.0)
2. Run the release script: `./scripts/release.sh <version>`
3. Monitor the output and report any errors
4. After successful release, display the next steps for submitting to Obsidian community plugins

The script will:
- Update version in manifest.json and package.json
- Build the production bundle
- Create releases/version{X}/ directory with artifacts
- Generate checksums
- Create git tag and push to GitHub
- Create GitHub release with downloadable assets

If there are any errors, offer to run the rollback command: `./scripts/release.sh rollback <version>`
