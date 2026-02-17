# AI Hub (GitHub Pages-ready static site)

A static website for curating AI tools and AI use-cases. Includes governance fields:
- Data classification: Public, Internal, Sensitive, Restricted
- Hosting
- PII risk
- Approval status

## Deploy to GitHub Pages
1. Create a GitHub repo (e.g., `ai-hub`).
2. Commit the contents of this folder to the repo root (so `index.html` is at root).
3. GitHub: **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` → Folder: `/(root)`.

## Edit content
- `assets/data.tools.json`
- `assets/data.usecases.json`

## Regenerate detail pages
After changing JSON, run:
```bash
python build.py
```

## Local preview
```bash
python -m http.server 8000
```
Open: http://localhost:8000

## Notes
- `.nojekyll` is included.
- All paths are relative so this works under `/<repo>/`.
