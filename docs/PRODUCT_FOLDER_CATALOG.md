# Product folder catalog — reusable pattern

> Owner agent: `dev-fullstack`  
> Code SoT: `PauloLinhares09/landing-pages`  
> Live examples:  
> - [`/digital_twin_market/`](https://www.paulolinhares-mrcoder.com.br/digital_twin_market/)  
> - [`/products/expert-no-ar-12h/`](https://www.paulolinhares-mrcoder.com.br/products/expert-no-ar-12h/)  
> Hub template: `_templates/folder-catalog/` (in landing-pages)

## When to use

A hub **folder** has one or more sellable landing pages, and the folder URL (`…/folder/` or `…/folder/index.html`) should show a **catalog**, not auto-redirect to a single LP.

Use for:

| Case | Example |
|------|---------|
| Product family / zone | `digital_twin_market/` (many LPs) |
| Single product folder (1+ SKUs) | `products/expert-no-ar-12h/` |
| Future client company folder | `{company-slug}/` or `{company-slug}/p/` index on **their** Pages repo |

Do **not** use to invent a second SoT inside the OpenClaw package — HTML lives only in the Pages repo.

## Golden rules (ads-safe)

```text
LP paths stay frozen (ads / Hotmart / canonical).
Folder index = catalog (update content in place).
Never meta-refresh / location.replace the folder to one product.
New MrCoder LPs still go under mrcoder/p/{slug}.html — catalog only lists them.
```

## URL map

| Piece | Path | Public URL |
|-------|------|------------|
| Catalog | `{folder}/index.html` | `https://{host}/{folder}/` |
| Styles | `{folder}/assets/catalog-folder.css` | `…/{folder}/assets/catalog-folder.css` |
| Each LP | `{folder}/{lp}.html` (or convention) | full absolute URL used in ads |

For new MrCoder products the LP file stays at `mrcoder/p/{slug}.html`. Optional catalog at `mrcoder/p/index.html` or `mrcoder/index.html` lists cards linking to those absolute paths.

## Card inventory rules

Include:

- Sellable / campaign LPs in that folder (or company scope)

Exclude:

- Privacy / institucional pages
- Experiments (`*_v2.html`, `noindex`)
- Asset-only paths
- Paths outside the folder unless the order explicitly asks for a **cross-zone hub home**

## UX contract (master)

Inspired by responsive product-card grids (image → title → subtitle → CTA).

1. Header — brand / folder name + short line  
2. Featured strip — horizontal scroll-snap (+ prev/next on desktop)  
3. Main grid — **4 / 2 / 1** columns  
4. Card — media, title, category line, “Ver página” → **full LP path**  
5. Footer — correct privacy (legacy vs `mrcoder/institucional`)  
6. SEO — canonical + `og:*` point to the **catalog URL**, not one product  

Stack: static HTML + one CSS file + tiny vanilla JS for carousel buttons. No build, no framework.

## Recipe for next customer / next product

```text
1. Open inbound order (edit_authorized or publish with new index).
2. Confirm host + folder + list of LP paths (frozen if already in ads).
3. Copy landing-pages `_templates/folder-catalog/` → `{folder}/`.
4. Rename/brand: titles, privacy link, card rows (href, image, copy).
5. Prefer existing OG images under `{folder}/assets/`; if missing, styled media panel (do not invent photography).
6. Add catalog URL to sitemap.xml (do not “fix” unrelated sitemap debt in the same commit unless asked).
7. Push Pages branch (usually master) → verify:
   - catalog 200, no refresh/replace
   - each card LP still 200
   - ads URLs untouched
8. Update office PRODUCT.md + LEGACY lock / LANDING_PAGES if the zone is production-critical.
9. Close outbound with commit_sha + live_url.
```

## Client with own domain

Same pattern on **their** GitHub Pages repo (separate CNAME). Scaffold:

```text
{company-slug}/
  index.html                 ← company catalog (optional)
  institucional/
  p/
    index.html               ← product catalog (optional)
    {product-slug}.html
    {product-slug}/assets/
```

Copy `_templates/folder-catalog/` into `p/` or company root as needed. Do not point client CNAME at the MrCoder hub.

## Office metadata

After go-live, record in `office/Nexserver-webpages/products/<PRD>/PRODUCT.md`:

- Catalog live URL  
- Card → LP map  
- Privacy target  

Reference implementations:

- DTM: `PRD-LEGACY-DIGITAL-TWIN-MARKET`  
- ENA12H: `PRD-LEGACY-EXPERT-NO-AR-12H`

## Anti-patterns

- Restoring folder auto-redirect “for convenience”  
- Moving LPs into the catalog folder structure  
- Dumping catalog HTML into the OpenClaw package as SoT  
- Listing draft/experiment URLs in the catalog without owner approval  
