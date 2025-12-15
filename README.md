# MillerNav

Miller columns navigation with user-defined folder hierarchy.

## Features

### Multi-Pane Hierarchical Navigation
Navigate through your vault using side-by-side panes that show the parent→child folder hierarchy, making it easy to visualize and traverse your note structure.

### User-Defined Navigation Levels
- Mark folders to appear as navigation levels
- Levels are computed dynamically based on marked ancestors
- Create a customized navigation structure that matches your workflow

### Virtual Folders (Level 0)
- **Recent**: Quick access to recently opened files
- **Tags**: Browse notes by tags
- **Shortcuts**: Pin frequently accessed folders and files
- **Entry Points**: User-marked starting points for navigation

### Cascade Collapse
Collapsing a navigation level automatically hides all previous levels for a cleaner, focused view.

### Mobile Support
- Single-pane mode optimized for mobile devices
- Swipe navigation for easy browsing on touch devices

## Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian Settings
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "MillerNav"
4. Click Install, then Enable

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/sidhanthapoddar99/obsidian_miller_nav/releases)
2. Extract the files to your vault's `.obsidian/plugins/miller-nav/` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

## Usage

### Basic Navigation
1. Open the MillerNav view from the ribbon icon or command palette
2. Click on folders to navigate through your vault hierarchy
3. Use the virtual folders in Level 0 to access Recent files, Tags, or Shortcuts

### Marking Folders
1. Right-click on a folder in MillerNav
2. Select "Mark as Navigation Level"
3. The folder will now appear as a navigation column

### Creating Shortcuts
1. Right-click on a folder or file
2. Select "Add to Shortcuts"
3. Access your shortcuts from the Shortcuts virtual folder

## Development

### Building the Plugin
```bash
cd miller_nav
npm install       # Install dependencies
npm run dev       # Development build (watch mode)
npm run build     # Production build
```

### Project Structure
- `miller_nav/src/` - TypeScript source files
- `miller_nav/styles/` - CSS styles
- `docs/` - Documentation

For more details, see [CLAUDE.md](CLAUDE.md).

## Requirements

- Obsidian v1.4.0 or higher
- Works on Desktop (Windows, macOS, Linux) and Mobile (iOS, Android)

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please [open an issue](https://github.com/sidhanthapoddar99/obsidian_miller_nav/issues) on GitHub.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Credits

- Inspired by the Miller columns navigation pattern popularized by macOS Finder
- Reference implementation patterns from [Notebook Navigator](https://github.com/johansan/notebook-navigator)

---

Made with ❤️ for the Obsidian community
