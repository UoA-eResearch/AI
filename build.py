"""AI Hub detail page generator.

Edit JSON:
  assets/data.tools.json
  assets/data.usecases.json

Then run:
  python build.py

This regenerates:
  tools/<slug>.html
  use-cases/<slug>.html
"""

import json
import re
from pathlib import Path

BASE = Path(__file__).parent
ASSETS = BASE / "assets"
TOOLS_DIR = BASE / "tools"
USECASES_DIR = BASE / "use-cases"

SITE_NAME = "AI Hub"


def slugify(s: str) -> str:
    s = (s or "").lower().strip().replace("&", " and ")
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    return s.strip("-") or "item"


def detail_doc(title: str, description: str, body: str) -> str:
    desc = description or "A curated, public resource of AI tools and use-cases."
    return f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />
  <title>{title}</title>
  <meta name=\"description\" content=\"{desc}\" />
  <link rel=\"stylesheet\" href=\"../assets/styles.css\" />
  <script defer src=\"../assets/app.js\"></script>
</head>
<body>
  <a class=\"skip-link\" href=\"#main\">Skip to content</a>
  <header class=\"site-header\">
    <div class=\"container header-inner\">
      <div class=\"brand\">
        <span class=\"logo\" aria-hidden=\"true\">&diams;</span>
        <a class=\"brand-link\" href=\"../index.html\">{SITE_NAME}</a>
      </div>
      <nav class=\"nav\" aria-label=\"Primary\">
        <a href=\"../tools.html\">Tools</a>
        <a href=\"../use-cases.html\">Use-cases</a>        <a href="../workshops.html">Workshops</a>        <a href=\"../about.html\">About</a>
        <button class=\"btn ghost\" id=\"themeToggle\" type=\"button\" aria-label=\"Toggle theme\">Theme</button>
      </nav>
    </div>
  </header>
  {body}
</body>
</html>
"""


def dl_row(k: str, v: str) -> str:
    v = v if v else "—"
    return f"<div class='dl-row'><dt>{k}</dt><dd>{v}</dd></div>"


def main():
    tools = json.loads((ASSETS / "data.tools.json").read_text(encoding="utf-8"))
    usecases = json.loads((ASSETS / "data.usecases.json").read_text(encoding="utf-8"))

    for t in tools:
        t["slug"] = t.get("slug") or slugify(t.get("name"))
    for u in usecases:
        u["slug"] = u.get("slug") or slugify(u.get("title"))

    tool_by_name = {t["name"]: t for t in tools}
    usecases_by_tool = {}
    for u in usecases:
        for tn in u.get("recommendedTools", []):
            usecases_by_tool.setdefault(tn, []).append(u)

    TOOLS_DIR.mkdir(exist_ok=True)
    USECASES_DIR.mkdir(exist_ok=True)

    for t in tools:
        related = usecases_by_tool.get(t["name"], [])
        related_html = "<p class='muted'>None linked yet.</p>"
        if related:
            related_html = "<ul>" + "".join(
                [f"<li><a href='../use-cases/{u['slug']}.html'>{u['title']}</a> <span class='muted'>({u['domain']} · {u['stage']})</span></li>" for u in related]
            ) + "</ul>"

        gov = "".join([
            dl_row("Category", t.get("category","")),
            dl_row("Audience", ", ".join(t.get("audience",[]))),
            dl_row("License", t.get("license","")),
            dl_row("Vendor", t.get("vendor","")),
            dl_row("Data classification", t.get("data_classification","")),
            dl_row("Hosting", t.get("hosting","")),
            dl_row("PII risk", t.get("pii_risk","")),
            dl_row("Approval status", t.get("approval_status","")),
            dl_row("Governance notes", t.get("governance_notes","")),
        ])
        tags = "".join([f"<span class='badge'>{x}</span>" for x in t.get("tags",[])])

        body = f"""
<main id='main' class='container section prose'>
  <a class='muted' href='../tools.html'>← Back to tools</a>
  <h1>{t['name']}</h1>
  <p class='muted'>{t.get('summary','')}</p>
  <div class='badges' style='margin:.6rem 0 1rem'>{tags}</div>
  <p><a class='btn primary' href='{t.get('website','#')}' target='_blank' rel='noopener noreferrer'>Official website ↗</a></p>
  <h2>Governance snapshot</h2>
  <dl class='dl'>{gov}</dl>
  <h2>Related use-cases</h2>
  {related_html}
</main>
<footer class='site-footer'>
  <div class='container footer-inner'>
    <p>© <span id='year'></span> {SITE_NAME}</p>
    <p class='muted'><a href='../about.html#disclaimer'>Disclaimer</a></p>
  </div>
</footer>
"""
        (TOOLS_DIR / f"{t['slug']}.html").write_text(detail_doc(f"{t['name']} — Tool — {SITE_NAME}", t.get("summary",""), body), encoding="utf-8")

    for u in usecases:
        steps = "".join([f"<li>{s}</li>" for s in u.get("workflow",[])])
        tool_links = []
        for tn in u.get("recommendedTools",[]):
            t = tool_by_name.get(tn)
            if t:
                tool_links.append(f"<li><a href='../tools/{t['slug']}.html'>{t['name']}</a> <span class='muted'>(Approval: {t.get('approval_status','—')}; Class: {t.get('data_classification','—')})</span></li>")
            else:
                tool_links.append(f"<li>{tn}</li>")
        tools_html = "<p class='muted'>No tools linked yet.</p>" if not tool_links else f"<ul>{''.join(tool_links)}</ul>"
        tags = "".join([f"<span class='badge'>{x}</span>" for x in u.get("tags",[])])

        body = f"""
<main id='main' class='container section prose'>
  <a class='muted' href='../use-cases.html'>← Back to use-cases</a>
  <h1>{u['title']}</h1>
  <p class='muted'>{u.get('summary','')}</p>
  <div class='badges' style='margin:.6rem 0 1rem'>
    <span class='badge'>{u.get('domain','')}</span>
    <span class='badge'>{u.get('stage','')}</span>
    {tags}
  </div>
  <h2>Workflow</h2>
  <ol>{steps}</ol>
  <h2>Recommended tools</h2>
  {tools_html}
  <h2>Governance notes</h2>
  <p class='muted'>{u.get('governance_notes','—')}</p>
</main>
<footer class='site-footer'>
  <div class='container footer-inner'>
    <p>© <span id='year'></span> {SITE_NAME}</p>
    <p class='muted'><a href='../about.html#disclaimer'>Disclaimer</a></p>
  </div>
</footer>
"""
        (USECASES_DIR / f"{u['slug']}.html").write_text(detail_doc(f"{u['title']} — Use‑case — {SITE_NAME}", u.get("summary",""), body), encoding="utf-8")


if __name__ == '__main__':
    main()
