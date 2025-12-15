#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PLUGIN_NAME="miller-nav"
MANIFEST_PATH="miller_nav/manifest.json"
PACKAGE_PATH="miller_nav/package.json"
BUILD_DIR="miller_nav/build"
RELEASES_DIR="releases"

# Helper functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."

    # Check if we're in the right directory
    if [ ! -f "$MANIFEST_PATH" ]; then
        print_error "manifest.json not found at $MANIFEST_PATH"
        print_error "Please run this script from the repository root"
        exit 1
    fi

    # Check if gh CLI is installed
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is not installed"
        echo "Install it from: https://cli.github.com/"
        exit 1
    fi

    # Check if jq is installed (for JSON manipulation)
    if ! command -v jq &> /dev/null; then
        print_error "jq is not installed"
        echo "Install it with: sudo apt install jq (Linux) or brew install jq (macOS)"
        exit 1
    fi

    # Check git status
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    # Check if gh is authenticated
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI is not authenticated"
        echo "Run: gh auth login"
        exit 1
    fi

    print_success "All prerequisites met"
}

# Get version from user or argument
get_version() {
    if [ -n "$1" ]; then
        VERSION="$1"
    else
        # Get current version from manifest
        CURRENT_VERSION=$(jq -r '.version' "$MANIFEST_PATH")
        echo "Current version: $CURRENT_VERSION"
        echo ""
        echo "Version format: MAJOR.MINOR.PATCH (e.g., 1.0.0)"
        read -p "Enter new version number: " VERSION
    fi

    # Validate version format
    if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        print_error "Invalid version format. Use MAJOR.MINOR.PATCH (e.g., 1.0.0)"
        exit 1
    fi

    print_success "Version set to: $VERSION"
}

# Update version in manifest.json and package.json
update_version_files() {
    print_step "Updating version in manifest.json and package.json..."

    # Update manifest.json
    jq --arg version "$VERSION" '.version = $version' "$MANIFEST_PATH" > "$MANIFEST_PATH.tmp"
    mv "$MANIFEST_PATH.tmp" "$MANIFEST_PATH"
    print_success "Updated $MANIFEST_PATH"

    # Update package.json
    jq --arg version "$VERSION" '.version = $version' "$PACKAGE_PATH" > "$PACKAGE_PATH.tmp"
    mv "$PACKAGE_PATH.tmp" "$PACKAGE_PATH"
    print_success "Updated $PACKAGE_PATH"
}

# Build the plugin
build_plugin() {
    print_step "Building plugin..."

    cd miller_nav

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_step "Installing dependencies..."
        npm install
    fi

    # Run production build
    npm run build

    cd ..

    print_success "Build completed"
}

# Create release directory and copy artifacts
create_release_artifacts() {
    print_step "Creating release artifacts..."

    RELEASE_DIR="$RELEASES_DIR/version$VERSION"

    # Create release directory
    mkdir -p "$RELEASE_DIR"
    print_success "Created directory: $RELEASE_DIR"

    # Copy required files
    cp "$BUILD_DIR/main.js" "$RELEASE_DIR/"
    cp "$BUILD_DIR/manifest.json" "$RELEASE_DIR/"

    # Copy styles.css if it exists
    if [ -f "$BUILD_DIR/styles.css" ]; then
        cp "$BUILD_DIR/styles.css" "$RELEASE_DIR/"
        print_success "Copied: main.js, manifest.json, styles.css"
    else
        print_success "Copied: main.js, manifest.json"
        print_warning "styles.css not found (this is okay if your plugin has no styles)"
    fi

    # Create ZIP file for Obsidian installation
    print_step "Creating ZIP archive..."
    cd "$RELEASE_DIR"

    if [ -f "styles.css" ]; then
        zip "${PLUGIN_NAME}-${VERSION}.zip" main.js manifest.json styles.css
    else
        zip "${PLUGIN_NAME}-${VERSION}.zip" main.js manifest.json
    fi

    cd - > /dev/null
    print_success "Created: $RELEASE_DIR/${PLUGIN_NAME}-${VERSION}.zip"
}

# Generate checksums
generate_checksums() {
    print_step "Generating checksums..."

    RELEASE_DIR="$RELEASES_DIR/version$VERSION"

    cd "$RELEASE_DIR"

    # Generate SHA256 checksums
    sha256sum *.zip *.js *.json *.css 2>/dev/null > SHA256SUMS || sha256sum *.zip *.js *.json > SHA256SUMS

    cd - > /dev/null

    print_success "Created: $RELEASE_DIR/SHA256SUMS"

    # Display checksums
    echo ""
    echo "Checksums:"
    cat "$RELEASE_DIR/SHA256SUMS"
    echo ""
}

# Get release notes
get_release_notes() {
    print_step "Preparing release notes..."

    echo ""
    echo "Enter release notes (press Ctrl+D when done, or Ctrl+C to use default):"
    echo "---"

    # Try to read from stdin with timeout
    if RELEASE_NOTES=$(timeout 30s cat 2>/dev/null); then
        echo "---"
    else
        # Use default release notes
        RELEASE_NOTES="Release version $VERSION

See [CHANGELOG](../docs/TODO.md) for details.

## Installation

### From GitHub Release
1. Download \`${PLUGIN_NAME}-${VERSION}.zip\`
2. Extract to your vault's \`.obsidian/plugins/${PLUGIN_NAME}/\` folder
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### From Obsidian Community Plugins
Once approved, you can install directly from Obsidian:
Settings → Community Plugins → Browse → Search for \"Miller Nav\"

## Verification

Verify the download integrity using SHA256:
\`\`\`bash
sha256sum -c SHA256SUMS
\`\`\`"
    fi

    # Save release notes to file
    RELEASE_DIR="$RELEASES_DIR/version$VERSION"
    echo "$RELEASE_NOTES" > "$RELEASE_DIR/RELEASE_NOTES.md"

    print_success "Release notes prepared"
}

# Commit and tag
commit_and_tag() {
    print_step "Committing changes and creating git tag..."

    # Add version files only (releases/ is in .gitignore)
    git add "$MANIFEST_PATH" "$PACKAGE_PATH"

    # Commit
    git commit -m "Release v${VERSION}

- Updated version to ${VERSION}
- Built and packaged release artifacts
- Generated checksums
"
    print_success "Created commit"

    # Create annotated tag
    git tag -a "v${VERSION}" -m "Release version ${VERSION}

${RELEASE_NOTES}"
    print_success "Created tag: v${VERSION}"
}

# Push to GitHub
push_to_github() {
    print_step "Pushing to GitHub..."

    # Get current branch
    BRANCH=$(git branch --show-current)

    # Push branch
    git push origin "$BRANCH"
    print_success "Pushed branch: $BRANCH"

    # Push tag
    git push origin "v${VERSION}"
    print_success "Pushed tag: v${VERSION}"
}

# Create GitHub release
create_github_release() {
    print_step "Creating GitHub release..."

    RELEASE_DIR="$RELEASES_DIR/version$VERSION"

    # Create release with artifacts
    gh release create "v${VERSION}" \
        --title "Miller Nav v${VERSION}" \
        --notes-file "$RELEASE_DIR/RELEASE_NOTES.md" \
        "$RELEASE_DIR/${PLUGIN_NAME}-${VERSION}.zip" \
        "$RELEASE_DIR/SHA256SUMS"

    print_success "GitHub release created"

    # Get release URL
    RELEASE_URL=$(gh release view "v${VERSION}" --json url -q .url)
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Release v${VERSION} created successfully!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "📍 Release URL: $RELEASE_URL"
    echo "📦 Local artifacts: $RELEASE_DIR"
    echo ""
}

# Verify release
verify_release() {
    print_step "Verifying release artifacts..."

    RELEASE_DIR="$RELEASES_DIR/version$VERSION"

    # Test ZIP extraction
    print_step "Testing ZIP archive..."
    if unzip -t "$RELEASE_DIR/${PLUGIN_NAME}-${VERSION}.zip" > /dev/null 2>&1; then
        print_success "ZIP archive is valid"
    else
        print_error "ZIP archive is corrupted"
        exit 1
    fi

    # Verify checksums
    print_step "Verifying checksums..."
    cd "$RELEASE_DIR"
    if sha256sum -c SHA256SUMS > /dev/null 2>&1; then
        print_success "All checksums verified"
    else
        print_error "Checksum verification failed"
        exit 1
    fi
    cd - > /dev/null
}

# Display next steps
display_next_steps() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Next Steps${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "1. Submit to Obsidian Community Plugins:"
    echo "   - Fork: https://github.com/obsidianmd/obsidian-releases"
    echo "   - Add entry to community-plugins.json:"
    echo ""
    echo "     {"
    echo "       \"id\": \"${PLUGIN_NAME}\","
    echo "       \"name\": \"Miller Nav\","
    echo "       \"author\": \"$(git config user.name)\","
    echo "       \"description\": \"Multi-pane hierarchical navigation using Miller columns\","
    echo "       \"repo\": \"$(gh repo view --json nameWithOwner -q .nameWithOwner)\""
    echo "     }"
    echo ""
    echo "   - Submit pull request"
    echo ""
    echo "2. Announce the release:"
    echo "   - Update documentation"
    echo "   - Post on forums/Discord"
    echo "   - Update README.md with installation instructions"
    echo ""
    echo "3. Monitor for issues:"
    echo "   - Watch GitHub issues"
    echo "   - Respond to user feedback"
    echo ""
}

# Rollback function
rollback() {
    print_warning "Rolling back release..."

    # Delete local tag
    if git tag -l "v${VERSION}" | grep -q "v${VERSION}"; then
        git tag -d "v${VERSION}"
        print_success "Deleted local tag"
    fi

    # Delete remote tag if it exists
    if git ls-remote --tags origin | grep -q "v${VERSION}"; then
        git push origin --delete "v${VERSION}"
        print_success "Deleted remote tag"
    fi

    # Delete GitHub release if it exists
    if gh release view "v${VERSION}" &> /dev/null; then
        gh release delete "v${VERSION}" --yes
        print_success "Deleted GitHub release"
    fi

    # Revert last commit if it's the release commit
    if git log -1 --pretty=%B | grep -q "Release v${VERSION}"; then
        git reset --hard HEAD~1
        print_success "Reverted release commit"
    fi

    print_success "Rollback complete"
}

# Main script execution
main() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Miller Nav Release Script${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    # Handle rollback command
    if [ "$1" = "rollback" ]; then
        if [ -z "$2" ]; then
            print_error "Please specify version to rollback"
            echo "Usage: $0 rollback <version>"
            exit 1
        fi
        VERSION="$2"
        rollback
        exit 0
    fi

    # Normal release flow
    check_prerequisites
    get_version "$1"

    echo ""
    read -p "Create release v${VERSION}? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Release cancelled"
        exit 0
    fi

    # Execute release steps
    update_version_files
    build_plugin
    create_release_artifacts
    generate_checksums
    verify_release
    get_release_notes
    commit_and_tag
    push_to_github
    create_github_release
    display_next_steps

    echo ""
    echo -e "${GREEN}✓ Release process completed successfully!${NC}"
    echo ""
}

# Trap errors and provide rollback option
trap 'echo ""; print_error "An error occurred. Run \"$0 rollback $VERSION\" to undo changes."; exit 1' ERR

# Run main function
main "$@"
