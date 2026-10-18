# PLVZ03 Portfolio

Static portfolio site (HTML, CSS and vanilla JS, no build step) in Catalan, Spanish and English.

## Structure

| Path | What it is |
| --- | --- |
| `index.html` | Page skeleton |
| `css/styles.css` | All styling (light and dark themes) |
| `js/content.js` | **All text and data**: projects, client work, rates, contact, in `ca` / `es` / `en` |
| `js/main.js` | Renders the content and handles the language switcher |
| `assets/img/` | Project images |

## Editing content

Everything you will normally change is in `js/content.js`:

- **Contact links**: fill the `contact` list (the footer section stays hidden while it is empty).
- **Release dates / status**: each project's `status` text, per language. `tone` controls the status dot: `dev`, `live`, `private` or `old`.
- **New project**: copy an existing entry in `projects`, change the `id`, `images` and the `en` / `es` / `ca` blocks.

## Running locally

Any static file server works, for example:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Publishing on GitHub Pages

Repository **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and `/ (root)`.
