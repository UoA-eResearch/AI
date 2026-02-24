const $ = (sel) => document.querySelector(sel);

function setYear(){ const el = $("#year"); if(el) el.textContent = new Date().getFullYear(); }
function setThemeFromStorage(){ const saved = localStorage.getItem("theme"); if(saved) document.documentElement.setAttribute("data-theme", saved); }
function toggleTheme(){
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
}

function uniq(arr){ return [...new Set(arr)].sort((a,b)=>a.localeCompare(b)); }

function slugify(str){
  return (str || "")
    .toLowerCase().trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "item";
}

function badge(text){ const span=document.createElement("span"); span.className="badge"; span.textContent=text; return span; }

function createCard({ title, name, summary, tags = [], meta, website, detailsHref, governanceMini }){
  const card = document.createElement("article");
  card.className = "card";

  const h = document.createElement("h3");
  if(detailsHref){
    const a = document.createElement("a");
    a.href = detailsHref;
    a.textContent = title || name;
    h.appendChild(a);
  } else {
    h.textContent = title || name;
  }

  const p = document.createElement("p");
  p.className = "meta";
  p.textContent = summary || "";

  const badges = document.createElement("div");
  badges.className = "badges";
  tags.filter(Boolean).slice(0, 7).forEach(t => badges.appendChild(badge(t)));

  const metaP = document.createElement("div");
  metaP.className = "meta";
  metaP.textContent = meta || "";

  const links = document.createElement("div");
  links.className = "links";

  if(detailsHref){
    const d = document.createElement("a");
    d.href = detailsHref;
    d.textContent = "Details →";
    links.appendChild(d);
  }

  if (website) {
    const a = document.createElement("a");
    a.href = website;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "Website ↗";
    links.appendChild(a);
  }

  card.append(h, p, badges);
  if(meta) card.append(metaP);
  if(links.childNodes.length) card.append(links);

  if(governanceMini){
    const g = document.createElement("p");
    g.className = "meta";
    g.textContent = governanceMini;
    card.append(g);
  }

  return card;
}

async function loadJSON(path){
  const res = await fetch(path, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function matchesQuery(item, q){
  if(!q) return true;
  const hay = [
    item.name, item.title, item.summary, item.category, item.domain, item.stage,
    item.hosting, item.pii_risk, item.data_classification, item.approval_status,
    ...(item.tags || []), ...(item.audience || []),
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(q.toLowerCase());
}

function piiBucket(v){
  const s = (v || "").toLowerCase();
  if(s.includes("high")) return "High";
  if(s.includes("medium")) return "Medium";
  if(s.includes("low")) return "Low";
  return "";
}

function hostingBucket(v){
  const s = (v || "").toLowerCase();
  if(s.includes("local")) return "Local (self-hosted)";
  if(s.includes("vendor") || s.includes("saas") || s.includes("cloud")) return "Cloud (vendor-hosted)";
  if(s.includes("hybrid")) return "Hybrid";
  return "";
}

/* ---------- Tools page ---------- */
async function initTools(){
  const data = await loadJSON("assets/data.tools.json");
  const grid = $("#toolsGrid");
  const q = $("#qTools"), cat = $("#catTools"), cls = $("#classTools"), appr = $("#apprTools"), host = $("#hostTools"), pii = $("#piiTools");
  const count = $("#toolsCount");

  const categories = uniq(data.map(d => d.category).filter(Boolean));
  categories.forEach(c => {
    const opt = document.createElement("option");
    opt.value=c; opt.textContent=c;
    cat.appendChild(opt);
  });

  function render(){
    const qv=q.value.trim();
    const cv=cat.value;
    const clv=cls.value;
    const av=appr.value;
    const hv=host.value;
    const pv=pii.value;

    const filtered = data.filter(d =>
      matchesQuery(d, qv) &&
      (!cv || d.category === cv) &&
      (!clv || (d.data_classification || "") === clv) &&
      (!av || (d.approval_status || "") === av) &&
      (!hv || hostingBucket(d.hosting) === hv) &&
      (!pv || piiBucket(d.pii_risk) === pv)
    );

    grid.innerHTML = "";
    filtered.forEach(d => {
      const slug = d.slug || slugify(d.name);
      grid.appendChild(createCard({
        name: d.name,
        summary: d.summary,
        tags: [...(d.tags || []), d.category, d.license, d.data_classification, d.approval_status].filter(Boolean),
        meta: `${d.category} · ${d.license} · ${(d.audience || []).join(", ")}`,
        website: d.website,
        detailsHref: `tools/${slug}.html`,
        governanceMini: `Class: ${d.data_classification || "—"} · Approval: ${d.approval_status || "—"} · Hosting: ${hostingBucket(d.hosting) || "—"} · PII: ${d.pii_risk || "—"}`
      }));
    });

    count.textContent = String(filtered.length);
  }

  [q, cat, cls, appr, host, pii].forEach(el => el && el.addEventListener("input", render));
  render();
}

/* ---------- Use-cases page ---------- */
async function initUsecases(){
  const data = await loadJSON("assets/data.usecases.json");
  const tools = await loadJSON("assets/data.tools.json");
  const toolByName = Object.fromEntries(tools.map(t => [t.name, t]));

  const grid = $("#usecasesGrid");
  const q = $("#qUsecases"), dom = $("#domUsecases"), stage = $("#stageUsecases"), pii = $("#piiUsecases");
  const count = $("#usecasesCount");

  const domains = uniq(data.map(d => d.domain).filter(Boolean));
  domains.forEach(d => {
    const opt = document.createElement("option");
    opt.value=d; opt.textContent=d;
    dom.appendChild(opt);
  });

  function usecasePII(u){
    // Estimate PII risk as the maximum PII risk across recommended tools (simple heuristic)
    const risks = (u.recommendedTools || []).map(n => piiBucket(toolByName[n]?.pii_risk));
    if(risks.includes("High")) return "High";
    if(risks.includes("Medium")) return "Medium";
    if(risks.includes("Low")) return "Low";
    return "";
  }

  function render(){
    const qv=q.value.trim();
    const dv=dom.value;
    const sv=stage.value;
    const pv=pii.value;

    const filtered = data.filter(u =>
      matchesQuery(u, qv) &&
      (!dv || u.domain === dv) &&
      (!sv || u.stage === sv) &&
      (!pv || usecasePII(u) === pv)
    );

    grid.innerHTML = "";
    filtered.forEach(u => {
      const slug = u.slug || slugify(u.title);
      grid.appendChild(createCard({
        title: u.title,
        summary: u.summary,
        tags: [...(u.tags || []), u.domain, u.stage].filter(Boolean),
        meta: `${u.domain} · ${u.stage}`,
        detailsHref: `use-cases/${slug}.html`,
        governanceMini: `PII (est.): ${usecasePII(u) || "—"}`
      }));
    });

    count.textContent = String(filtered.length);
  }

  [q, dom, stage, pii].forEach(el => el && el.addEventListener("input", render));
  render();
}

/* ---------- Workshops page ---------- */
function initWorkshops(){
  const workshops = [
    {
      name: "Prompt Engineering",
      summary: "Learn techniques for crafting effective prompts to improve AI model outputs and achieve consistent results across applications.",
      level: "Beginner",
      type: "Self-paced",
      tags: ["prompting", "best practices"],
      slug: "prompt-engineering"
    }
  ];

  const grid = $("#workshopsGrid");
  const q = $("#qWorkshops"), level = $("#levelWorkshops"), type = $("#typeWorkshops");
  const count = $("#workshopsCount");

  function render(){
    const qv = q.value.trim();
    const lv = level.value;
    const tv = type.value;

    const filtered = workshops.filter(w =>
      matchesQuery(w, qv) &&
      (!lv || w.level === lv) &&
      (!tv || w.type === tv)
    );

    grid.innerHTML = "";
    filtered.forEach(w => {
      grid.appendChild(createCard({
        name: w.name,
        summary: w.summary,
        tags: [...(w.tags || []), w.level].filter(Boolean),
        meta: `${w.level} · Workshop`,
        detailsHref: `workshops/${w.slug}.html`
      }));
    });

    count.textContent = String(filtered.length);
  }

  [q, level, type].forEach(el => el && el.addEventListener("input", render));
  render();
}

/* ---------- Home page ---------- */
async function initHome(){
  const [tools, usecases] = await Promise.all([
    loadJSON("assets/data.tools.json"),
    loadJSON("assets/data.usecases.json")
  ]);

  const st = $("#statTools"), su = $("#statUsecases");
  if(st) st.textContent = String(tools.length);
  if(su) su.textContent = String(usecases.length);

  const featuredGrid = $("#featuredGrid");
  if(featuredGrid){
    const featured = [
      ...tools.slice(0, 2).map(t => ({ type: "tool", ...t })),
      ...usecases.slice(0, 1).map(u => ({ type: "usecase", ...u }))
    ];

    featuredGrid.innerHTML = "";
    featured.forEach(item => {
      if(item.type === "tool"){
        const slug = item.slug || slugify(item.name);
        featuredGrid.appendChild(createCard({
          name: item.name,
          summary: item.summary,
          tags: [...(item.tags || []), item.category, item.data_classification, item.approval_status].filter(Boolean),
          meta: `Tool · ${item.category} · ${item.license}`,
          website: item.website,
          detailsHref: `tools/${slug}.html`,
          governanceMini: `Class: ${item.data_classification || "—"} · Approval: ${item.approval_status || "—"}`
        }));
      } else {
        const slug = item.slug || slugify(item.title);
        featuredGrid.appendChild(createCard({
          title: item.title,
          summary: item.summary,
          tags: [...(item.tags || []), item.domain, item.stage].filter(Boolean),
          meta: `Use‑case · ${item.domain} · ${item.stage}`,
          detailsHref: `use-cases/${slug}.html`
        }));
      }
    });
  }
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  setYear();
  setThemeFromStorage();
  const themeBtn = $("#themeToggle");
  if(themeBtn) themeBtn.addEventListener("click", toggleTheme);

  const page = document.querySelector("main")?.getAttribute("data-page");
  if(page === "tools") initTools();
  else if(page === "usecases") initUsecases();
  else if(page === "workshops") initWorkshops();
  else initHome();
});
