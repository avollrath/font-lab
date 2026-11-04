# Font Lab

**Experiment with Google Fonts and typography on any website, instantly.**

Font Lab is a Chrome browser extension that lets you experiment with typography on any website in real time. Select Google Fonts for different HTML elements, adjust sizes and weights, and immediately see the results — without touching any code.

## Features

- **Live typography editing** — Changes apply instantly as you adjust settings
- **Google Fonts integration** — Search and apply from 200+ Google Fonts, no API key required
- **Per-element control** — Independent typography settings for H1–H6, paragraphs, links, buttons, lists, inputs, and more
- **Optional property overrides** — Change only what you want; unchanged properties preserve the site's original styles
- **Typography controls** — Font family, size (px/rem/em), weight, line height, letter spacing, font style, text transform
- **Global toggle** — Instantly compare original vs. modified typography (Alt+Shift+F)
- **Persistence** — Settings are automatically saved per website origin and restored on reload
- **CSS export** — Copy or download valid CSS with Google Fonts `@import` statements
- **Custom selectors** — Add rules targeting any CSS selector beyond the default elements
- **Presets** — Save and reapply typography configurations across different sites
- **Shadow DOM isolation** — The editor UI is fully isolated from the website's styles
- **Light & dark mode** — Follows your system preference
- **Draggable panel** — Reposition the editor anywhere on screen

## Installation

### Load as unpacked extension (development)

1. Clone the repository:
   ```bash
   git clone https://github.com/avollrath/font-lab.git
   cd font-lab
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Open Chrome and navigate to `chrome://extensions`

5. Enable **Developer mode** (toggle in the top-right corner)

6. Click **Load unpacked**

7. Select the build output directory:
   ```
   font-lab/.output/chrome-mv3
   ```

8. The Font Lab icon will appear in your Chrome toolbar. Click it on any website to open the editor.

## Development

Run WXT in development mode with hot module replacement:

```bash
npm run dev
```

This opens a browser with the extension loaded. Changes to source files reload the extension automatically.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start WXT development server |
| `npm run build` | Production build to `.output/chrome-mv3/` |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests with Vitest |
| `npm run lint` | ESLint source files |

## Architecture

### Background service worker (`entrypoints/background.ts`)
Handles the extension action (toolbar icon click) and sends `TOGGLE_PANEL` messages to the active tab's content script.

### Content script (`entrypoints/content/index.tsx`)
- Runs on every page at `document_end`
- Immediately restores saved typography from Chrome Storage
- Creates a Shadow DOM host for the React editor panel
- Mounts React lazily only when the panel is opened
- Listens for `TOGGLE_PANEL` messages from the background

### React editor (`entrypoints/content/editor/`)
The floating panel UI, fully isolated via Shadow DOM. Components:
- **FloatingPanel** — Panel shell, dragging, minimize/close, section tabs
- **ElementList** — Grouped element categories with bulk enable/disable actions
- **ElementRule** — Individual element row with expand/collapse
- **FontPicker** — Searchable Google Fonts dropdown with category filter
- **TypographyControls** — Font size, weight, line height, letter spacing, style, transform
- **ElementPicker** — Visual element picker overlay (click any element on the page)
- **PresetManager** — Save, apply, and delete named typography configurations
- **ExportPanel** — Generate, copy, and download CSS with Google Fonts imports

### Typography engine (`src/services/typographyEngine/`)
Maintains a single `<style>` element in the page with id `font-lab-styles`. Rules are generated as CSS with `!important` to override site styles. The stylesheet is updated atomically on any change — never duplicated.

### Font loading (`src/services/fontLoader/`)
- Loads Google Fonts via `<link rel="stylesheet">` injection (or fetch fallback)
- Deduplicates requests — each font family is loaded at most once
- Generates optimized Google Fonts URLs with only the requested weights

### Storage (`src/services/storage/`)
Uses `browser.storage.local` (WXT cross-browser API). Configs are keyed by site origin (`font-lab-site:https://example.com`). Uses schema versioning and graceful migration for forward compatibility.

### Zustand store (`src/stores/typographyStore.ts`)
Central application state. Actions:
- `initialize(origin)` — Load config and apply saved styles
- `updateRule(id, updates)` — Merge rule properties and sync stylesheet
- `toggleRule(id)` — Enable/disable a rule
- `resetRule(id)` — Remove all overrides for an element
- `resetAll()` — Reset entire site configuration
- `setGlobalEnabled(bool)` — Toggle all modifications on/off
- `savePreset(name)` / `applyPreset(preset)` — Preset management
- `exportCurrentCSS(includeImportant)` — Generate CSS string

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Save typography configurations per website |
| `activeTab` | Send messages to the currently active tab |
| `scripting` | Inject content script on demand if not already present |
| `https://fonts.googleapis.com/*` | Load Google Fonts CSS stylesheets |
| `https://fonts.gstatic.com/*` | Load Google Fonts font files |
| `<all_urls>` | Run content script on any website |

## Privacy

Font Lab does not collect, transmit, or store any browsing data. No accounts, no analytics, no telemetry. All settings are stored locally in your browser using Chrome's Storage API.

When you select a Google Font, Font Lab makes a request to `fonts.googleapis.com` to load the font. This is subject to Google's privacy policy for their font hosting service.

## Known Limitations

- **CSS specificity** — Font Lab uses `!important` to override site styles, but inline `!important` styles on individual elements will take precedence. This is a browser CSS cascade limitation.
- **Shadow DOM content** — Typography changes do not apply to elements inside a website's own shadow roots (which are inaccessible to external scripts by design).
- **Restricted pages** — The extension cannot run on `chrome://` URLs, the Chrome Web Store, or other browser-restricted pages.
- **Cross-origin iframes** — Content inside cross-origin iframes is not accessible to the extension.
- **SPA navigation** — On single-page apps, the managed stylesheet persists through client-side navigation since it's injected into the document head.

## Future Enhancements

- Visual element picker (hover-to-highlight, click-to-select any element)
- Font preview rendering (show font name in its own typeface in the selector)
- Recently used and favorited fonts
- Built-in typography presets (Modern Sans, Editorial, Minimal)
- Firefox / Edge compatibility
- Variable font support with continuous weight sliders
- Playwright end-to-end browser tests
- Font weight availability awareness (only offer weights the selected font supports)
