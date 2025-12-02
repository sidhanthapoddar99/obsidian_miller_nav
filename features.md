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
| Context Menus | Right-click actions | ✅ Done |
| Note Count Badge | Show file count on folders | ✅ Done |

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

### Cascade Collapse
| Feature | Description | Status |
|---------|-------------|--------|
| Collapse to Level | Hide levels 0 through N-1 | 🔲 Pending |
| Expand from Collapsed | Restore hidden levels | 🔲 Pending |
| Collapse Animation | Smooth transitions | 🔲 Pending |

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
