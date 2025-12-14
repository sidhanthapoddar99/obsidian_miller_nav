# MillerNav Features

## Phase 1: MVP (Core Navigation)

### Navigation
| Feature | Description | Status |
|---------|-------------|--------|
| Miller Columns View | Multi-pane sidebar navigation | ✅ Done |
| Vault Root Display | Show entire vault as browsable folder | ✅ Done |
| Tree Expansion | Unmarked folders expand downward in same pane | ✅ Done |
| Subfolder Navigation | Marked folders open in new columns | ✅ Done |
| File Opening | Click file to open in editor | ✅ Done |
| Breadcrumb Navigation | Path display at bottom | ✅ Done |

### Subfolder System
| Feature | Description | Status |
|---------|-------------|--------|
| Set as Subfolder | Right-click context menu option | ✅ Done |
| Remove Subfolder | Right-click context menu option | ✅ Done |
| Level Computation | Dynamic level calculation based on ancestors | ✅ Done |
| Max Levels Setting | Configure 1-4 navigation levels | ✅ Done |
| Subfolder Indicator | Arrow icon for subfolder items | ✅ Done |

### Data Persistence
| Feature | Description | Status |
|---------|-------------|--------|
| folders.json | Store subfolder configuration | ✅ Done |
| Debounced Saves | Prevent excessive disk writes | ✅ Done |
| Folder Rename Handling | Update paths on rename | ✅ Done |
| Folder Delete Handling | Clean up on delete | ✅ Done |

### Settings
| Feature | Description | Status |
|---------|-------------|--------|
| General Tab | Navigation and display settings | ✅ Done |
| Subfolders Tab | Manage subfolder list | ✅ Done |
| Max Levels Slider | Configure navigation depth | ✅ Done |
| Display Toggles | Show/hide various elements | ✅ Done |
| Excluded Folders | Pattern-based exclusion | ✅ Done |
| Invalid Cleanup | Remove missing subfolders | ✅ Done |

### UI Components
| Feature | Description | Status |
|---------|-------------|--------|
| Toolbar | Collapse/Refresh/New buttons | ✅ Done |
| Pane Component | Individual column rendering | ✅ Done |
| Context Menus | Comprehensive right-click menu system (see Context Menu System section below) | ✅ Done |
| Note Count Badge | Show file count on folders | ✅ Done |

### Drag & Drop
| Feature | Description | Status |
|---------|-------------|--------|
| Drag Files | Drag files to move between folders | ✅ Done |
| Drag Folders | Drag folders to reorganize | ✅ Done |
| Drop Targets | Visual feedback on valid drop targets | ✅ Done |
| Multi-item Drag | Drag multiple selected items at once | ✅ Done |

### Multi-Selection
| Feature | Description | Status |
|---------|-------------|--------|
| Ctrl/Cmd+Click | Toggle item selection | ✅ Done |
| Shift+Click | Range selection (select all items between anchor and target) | ✅ Done |
| Selection Highlight | Visual indicator for selected items | ✅ Done |
| Bulk Actions | Context menu actions on multiple items | ✅ Done |
| Clear Selection | Click elsewhere to deselect | ✅ Done |

### Column Collapse
| Feature | Description | Status |
|---------|-------------|--------|
| Shrink Column | Collapse column to narrow strip | ✅ Done |
| Expand Column | Restore collapsed column | ✅ Done |
| Level Indicator | Show level number on collapsed strip | ✅ Done |
| Folder Name | Show folder name vertically | ✅ Done |
| Selected Item | Show selected item on collapsed strip | ✅ Done |

---

## Recent Enhancements (December 2025)

### File Display & Visual Feedback
| Feature | Description | Status |
|---------|-------------|--------|
| Active File Highlighting | Currently open file is highlighted with accent border and icon color | ✅ Done |
| All File Types Support | Shows all files, not just .md (canvas, base, pdf, images, audio, video with appropriate icons) | ✅ Done |
| Unknown Extension Labels | Unknown file types show dimmed uppercase extension label (e.g., "DRAWING", "TXT") | ✅ Done |
| Ignored Extensions Setting | Setting to hide specific file extensions from navigator | ✅ Done |

### File Management
| Feature | Description | Status |
|---------|-------------|--------|
| Create Canvas/Base | Footer and right-click menu now have options to create Canvas (.canvas) and Base (.base) files | ✅ Done |
| Rename Functionality | Working rename modal for files and folders (Enter to confirm, Escape to cancel) | ✅ Done |

### UX Improvements
| Feature | Description | Status |
|---------|-------------|--------|
| Auto-close Unused Columns | Clicking item in earlier column closes columns to the right | ✅ Done |
| Footer Icons Only | Footer buttons now show prominent icons only (32x32) with tooltips, no text labels | ✅ Done |

### Bug Fixes
| Feature | Description | Status |
|---------|-------------|--------|
| Duplicate Panel Fix | Fixed issue where right-click caused duplicate columns due to double event handlers | ✅ Done |

### Context Menu System (December 15, 2025)
| Feature | Description | Status |
|---------|-------------|--------|
| Modular Architecture | Context menu split into separate files by functionality (fileMenuItems, folderMenuItems, bulkMenuItems) | ✅ Done |
| Comprehensive File Menu | 20+ file operations including open options, duplicating, clipboard operations, system integration | ✅ Done |
| Comprehensive Folder Menu | 20+ folder operations including subfolder marking, creation options, folder operations, system integration | ✅ Done |
| Opening Options | Open in new tab, open to right, open in new window | ✅ Done |
| File Operations | Duplicate files, move file to, copy/cut (planned), merge (planned) | ✅ Done |
| Folder Operations | Create note/folder/canvas/base, duplicate (planned), move, search (planned), copy/cut (planned) | ✅ Done |
| Clipboard Operations | Copy Obsidian URL, copy path, copy relative path | ✅ Done |
| System Integration | Open in default app, show in system explorer | ✅ Done |
| Bulk Operations | Multi-select actions for files and folders | ✅ Done |
| Subfolder Bulk Actions | Set/remove subfolder marking for multiple folders at once | ✅ Done |
| Create Folder with Selected | Create a new folder and move all selected items into it | ✅ Done |
| Icon Customization (Planned) | Change icon, change icon color, remove icon - UI placeholders added | 🔲 Pending |
| Folder Customization (Planned) | Change background color for folders - UI placeholder added | 🔲 Pending |
| Password Protection (Planned) | Password protect files and folders - UI placeholder added | 🔲 Pending |
| Add to Shortcuts (Planned) | Quick add files/folders to shortcuts section - UI placeholder added | 🔲 Pending |

---

## Phase 2: Virtual Folders & Shortcuts

### Virtual Folders
| Feature | Description | Status |
|---------|-------------|--------|
| Recent Notes | Show recently opened files | 🔲 Pending |
| Tags Browser | Navigate by tags | 🔲 Pending |
| Shortcuts Section | Quick access items | 🔲 Pending |

### Shortcuts
| Feature | Description | Status |
|---------|-------------|--------|
| shortcuts.json | Store shortcut data | ✅ Done (structure) |
| Add Shortcut | Add file/folder to shortcuts | 🔲 Pending |
| Remove Shortcut | Remove from shortcuts | 🔲 Pending |
| Shortcut Ordering | Drag to reorder | 🔲 Pending |

---

## Phase 3: Customization

### Icons
| Feature | Description | Status |
|---------|-------------|--------|
| Folder Icons | Custom icons per folder | 🔲 Pending |
| Icon Picker | UI for selecting icons | 🔲 Pending |
| Icon Pack Support | Lucide, custom packs | 🔲 Pending |

### Colors
| Feature | Description | Status |
|---------|-------------|--------|
| Folder Colors | Custom text colors | 🔲 Pending |
| Background Colors | Custom background colors | 🔲 Pending |
| Color Picker | UI for selecting colors | 🔲 Pending |

### Dividers
| Feature | Description | Status |
|---------|-------------|--------|
| Section Dividers | Visual separators | ✅ Done (basic) |
| Custom Dividers | User-configured dividers | 🔲 Pending |

### Folder Metadata
| Feature | Description | Status |
|---------|-------------|--------|
| appearance.json | Store visual settings | 🔲 Pending |
| Custom Sort Order | Per-folder sorting | 🔲 Pending |
| Pinned Notes | Pin notes to top | 🔲 Pending |

---

## Phase 4: Mobile & Performance

### Mobile Support
| Feature | Description | Status |
|---------|-------------|--------|
| Single Pane Mode | One column on mobile | 🔲 Pending |
| Swipe Navigation | Swipe between levels | 🔲 Pending |
| Touch Gestures | Long-press for context menu | 🔲 Pending |
| Responsive Layout | Adapt to screen size | 🔲 Pending |

### Performance
| Feature | Description | Status |
|---------|-------------|--------|
| Virtual Scrolling | Render visible items only | 🔲 Pending |
| Lazy Loading | Load children on demand | ✅ Done |
| RAM Caching | Cache folder structures | 🔲 Pending |
| Batch Updates | Optimize re-renders | 🔲 Pending |

---

## Phase 5: Polish & Integrations

### Keyboard Navigation
| Feature | Description | Status |
|---------|-------------|--------|
| Arrow Keys | Navigate items | 🔲 Pending |
| Enter to Open | Open selected item | 🔲 Pending |
| Escape to Collapse | Close current pane | 🔲 Pending |
| Hotkeys | Customizable shortcuts | 🔲 Pending |

### Integrations
| Feature | Description | Status |
|---------|-------------|--------|
| Style Settings | CSS variable integration | 🔲 Pending |
| Iconize Support | External icon plugin | 🔲 Pending |
| Dataview Support | Query-based folders | 🔲 Pending |

### Commands
| Feature | Description | Status |
|---------|-------------|--------|
| Open MillerNav | Command palette | ✅ Done |
| Reveal File | Show file in navigator | ✅ Done (basic) |
| Collapse All | Close all panes | ✅ Done |
| Refresh View | Reload navigator | ✅ Done |

### Documentation
| Feature | Description | Status |
|---------|-------------|--------|
| README | User guide | 🔲 Pending |
| API Documentation | Developer docs | 🔲 Pending |
| Example Configs | Sample setups | 🔲 Pending |

---

## Legend

- ✅ Done - Feature implemented and working
- 🔲 Pending - Feature planned but not started
- 🚧 In Progress - Feature currently being developed
- ❌ Blocked - Feature blocked by dependency
