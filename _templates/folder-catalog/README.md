# Folder catalog template

Static catalog for a hub folder (`index.html` at folder root).  
Playbook: `docs/PRODUCT_FOLDER_CATALOG.md` (office mirror: `office/Nexserver-webpages/company/hub/PRODUCT_FOLDER_CATALOG.md`).

## Install

```bash
# from landing-pages repo root
FOLDER="path/to/product-or-zone-folder"
cp -R _templates/folder-catalog/index.html "$FOLDER/index.html"
mkdir -p "$FOLDER/assets"
cp _templates/folder-catalog/assets/catalog-folder.css "$FOLDER/assets/catalog-folder.css"
```

Then edit `index.html`:

1. Brand / titles / description / canonical / og:*
2. Privacy href (legacy vs mrcoder)
3. Card list: `href`, image, title, subtitle
4. Remove unused sample cards

## Rules

- Do not auto-redirect the folder to one LP.
- Card links must be the real LP paths used in ads.
- One CSS file + tiny carousel JS only.
