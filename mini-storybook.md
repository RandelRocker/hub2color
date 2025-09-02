# Build “Mini Storybook” (React + MUI + RHF + Webpack)

You are an expert full‑stack engineer working inside Cursor. Follow the plan **step‑by‑step** and produce a clean, production‑ready implementation that matches the spec below. Work incrementally: after each step, run and verify locally before proceeding. When uncertain, choose the simplest implementation that satisfies the spec.

---

## Project Summary

Build a lightweight web app with **features similar to Storybook**:

- **Two‑column layout**: left **Sidebar** with logo + grouped, searchable menu of pages; each page should have a "page" icon if doesn't contain child and "folder" icon if does. Right **Content** area with a **Top Bar**, a **component preview iframe**, and a **Settings Panel** at the bottom.
- **Pages list** is fetched by **GET** from `public/api/pages.json` (format shown below). Each page item includes a title, icon of the page, and an HTML preview **path** (served locally under `public/`). Clicking a page loads the **iframe** with that HTML (same origin).
- **Top Bar** controls: Zoom In, Zoom Out, Reset Zoom | Desktop view, Tablet view, Mobile view | RTL / LTR toggle. (Vertical separators between the groups.)
- **Settings Panel** (dockable bottom/right): Header with right‑side action buttons (dock toggle, reset to **default**, **Save**) and left‑side tabs: **Controls**, **Styling**, **Custom CSS**, **Custom JS**.
- **Controls** tab renders a table: Name | Description | Control. Controls are generated dynamically from a JSON schema per page (types: text, number, boolean, select, multi‑select, color, slider, etc.). On **any change**, send a `postMessage` to the iframe (protocol defined below) and also apply changes if same‑origin access is available.
- **Styling / Custom CSS / Custom JS** tabs provide code editors (Monaco) and an **Apply** button. When applied, inject CSS/JS into the iframe and send a `postMessage` reflecting the change.
- **Persistence**: “Save” stores the current settings bundle to `localStorage` **per page**; “Reset to previous saved” restores from storage; “Reset to default” restores schema defaults.
- **Theming**: simple **light** theme with **Material UI v5**.
- **Build tool**: **Webpack 5** (no CRA).

> The goal is a focused “mini Storybook” that previews static HTML components while letting the user tweak inputs, styles, and injected JS via a friendly UI.

---

## Tech Stack & Versions

- **React 18** (TypeScript)
- **Material UI v5**
- **react-hook-form v7+**
- **Redux**
- **Monaco Editor**
- **ionicons**
- **Webpack 5** + **devServer** (serves `public/`)
- **ESLint** + **Prettier** (opinionated defaults)

Node: 18+ or 20+. Use ES2022 syntax where convenient.

---

## Data Contracts

### Pages List (GET `/api/pages.json`)

```json
[
  {
    "sectionTitle": "Components",
    "items": [
      { "title": "Button", "path": "components/button.html" },
      { "title": "Card", "path": "components/card.html" }
    ]
  },
  {
    "sectionTitle": "Layouts",
    "items": [{ "title": "Hero", "path": "layouts/hero.html" }]
  }
]
```

- `icon` is a **ionicons** name from `ionicons/icons`. If missing or invalid, fall back to `material ui` icons.
- Files referenced by `path` live under `public/` and are served by the dev server.

### Controls Schema (derived path)

For a given page item with `path: "components/button.html"`, fetch its controls schema from the **same directory** with suffix `.props.schema.json`:
`public/components/button.props.schema.json`

Example controls schema:

```json
{
  "version": 1,
  "defaults": {
    "label": "Click me",
    "variant": "contained",
    "disabled": false,
    "size": "medium",
    "count": 1,
    "hue": 210
  },
  "fields": [
    {
      "name": "label",
      "label": "Label",
      "description": "Button text",
      "type": "text"
    },
    {
      "name": "variant",
      "label": "Variant",
      "description": "MUI button variant",
      "type": "select",
      "options": ["text", "outlined", "contained"]
    },
    {
      "name": "disabled",
      "label": "Disabled",
      "description": "Disable the button",
      "type": "boolean"
    },
    {
      "name": "size",
      "label": "Size",
      "description": "Button size",
      "type": "radio",
      "options": ["small", "medium", "large"]
    }
  ]
}
```

- `defaults` gives initial values and drives **Reset to default**.
- Supported control types: `text`, `number`, `boolean` (switch), `select`, `multi-select`, `radio`, `color`, `slider`. Extendable.

---

## postMessage Protocol

All parent → iframe messages use:

```ts
{ source: "mini-storybook", type: string, payload?: any }
```

**Types** (parent → iframe):

- `NAVIGATED` `{ path: string }` — fired after the iframe loads a new page.
- `PROPS_CHANGE` `{ name: string, value: any }` — individual props change.
- `CONTROL_CHANGE` `{ name: string, value: any }` — individual control change.
- `BULK_CONTROLS` `{ values: Record<string, any> }` — when applying defaults/restore/save.
- `APPLY_CSS` `{ css: string }` — replace injected CSS (`<style id="injected-css">`).
- `APPLY_JS` `{ js: string }` — evaluate/replace injected JS in the iframe.
- `SET_DIR` `{ dir: "ltr" | "rtl" }` — set `document.documentElement.dir` in the iframe.
- `SET_VIEWPORT` `{ width: number }` — parent will also set container width.
- `SET_ZOOM` `{ scale: number }` — parent will also apply CSS transform on iframe body.

The parent will inject CSS/JS directly (same-origin) **and** send messages for transparency. The child page may optionally listen and react; a helper is provided.

### Child Listener Helper (include in each HTML preview page)

Embed before the closing `</body>` or from a shared script:

```html
<script>
  (function () {
    const SRC = "mini-storybook";
    function ensureStyleTag() {
      let tag = document.getElementById("injected-css");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "injected-css";
        document.head.appendChild(tag);
      }
      return tag;
    }
    function ensureScriptTag() {
      let tag = document.getElementById("injected-js");
      if (!tag) {
        tag = document.createElement("script");
        tag.id = "injected-js";
        document.body.appendChild(tag);
      }
      return tag;
    }
    window.addEventListener("message", (e) => {
      const data = e.data || {};
      if (data && data.source === SRC) {
        switch (data.type) {
          case "APPLY_CSS":
            ensureStyleTag().textContent = data.payload?.css || "";
            break;
          case "APPLY_JS":
            const js = data.payload?.js || "";
            // Replace previous injected script
            const s = ensureScriptTag();
            s.textContent = js;
            break;
          case "SET_DIR":
            document.documentElement.setAttribute(
              "dir",
              data.payload?.dir || "ltr",
            );
            break;
          case "PROPS_CHANGE":
            break;
          case "CONTROL_CHANGE":
          case "BULK_CONTROLS":
            // Components may listen for these to re-render UI, if needed.
            break;
          case "SET_ZOOM":
          case "SET_VIEWPORT":
          case "NAVIGATED":
          default:
            break;
        }
      }
    });
  })();
</script>
```

---

## UI / UX Requirements

### Layout

- **Left column (Sidebar, fixed width ~300px)** with logo at top, then **search** (filters by group title or page title, case‑insensitive), then **accordion groups**. Group header expands/collapses to reveal page items. Each item shows **icon** + **title**.
- **Right column (Content)** id a flex container with
  - **Top Bar** ( height ~ 40px).
  - **Iframe Preview** that fills all available space between Top Bar and Settings Panel.
  - **Settings Panel** docked **bottom** by default (height ~320px, resizable via CSS). Dock toggle moves panel to the **right** (width ~360px) and adjusts the preview area accordingly.

### Top Bar Controls (left → right)

- **Zoom In**, **Zoom Out**, **Reset Zoom**
- Vertical separator
- **Desktop view** (does nothing for now), **Tablet view** (does nothing for now), **Mobile view** (does nothing for now)
- Vertical separator
- **RTL**, **LTR** one button (highlight active) use <ion-icon name="swap-horizontal-outline"></ion-icon>. if inactive then direction by default if enabled then RTL

### Settings Panel

- **Header**: right icon buttons = **Dock Toggle**, **Reset to Previous Saved**, **Reset to Default**, **Save**. Left side = Tabs (**Controls**, **Styling**, **Custom CSS**, **Custom JS**).
- **Controls** tab = is intended to change component props like button variant, children etc. Should not be saved to local storage or elsewere. Table layout with columns: _Name_ | _Description_ | _Control_. Render controls from schema using `react-hook-form` with `Controller`. On change, **postMessage** `CONTROL_CHANGE`, and apply immediately if possible. Table width should fit screen width without scrolling
- **Styling** tab = is intended to change component styling by using material ui sx. Table layout with columns: _Name_ | _Description_ | _Control_. Render controls from schema using `react-hook-form` with `Controller`. On change, update local form state, **postMessage** `CONTROL_CHANGE`, and apply immediately if possible. Table width should fit screen width without scrolling
- **Custom CSS** tab = Monaco editor (empty by default). Apply button same behavior as Styling.
- **Custom JS** tab = Monaco editor; Apply button sends `APPLY_JS` and injects/evaluates the code (non‑persisted unless saved to localStorage bundle).

### Persistence

- Use `localStorage` key: `msb:state:${pagePath}` storing:

```json
{
  "controls": { "field": "value", "...": "..." },
  "styling": "/* css */",
  "customCss": "/* css */",
  "customJs": "// js",
  "dir": "ltr",
  "zoom": 1
}
```

- **Save** persists current state. **Reset to previous saved** restores it. **Reset to default** derives from schema’s `defaults` and clears custom code.
