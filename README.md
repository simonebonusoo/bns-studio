# BNS Studio — website (React + Tailwind + Framer Motion)

## Avvio rapido
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Dove cambiare contenuti
- `src/sections/*` (testi, servizi, portfolio, prezzi, risorse)
- `src/components/Navbar.tsx` (menu)
- `src/styles.css` (effetti: griglia, glass, noise)

## Persistenza catalogo shop
- Documentazione completa: `docs/catalog-persistence.md`
- Database locale predefinito: `data/shop/dev.db`
- Upload immagini prodotto: `data/uploads/products/`
- Archivio file-based prodotti: `data/Prodotti/<slug>/`
- Asset storage mode: `ASSET_STORAGE_MODE=local|cloudinary`
- Render persistent disk consigliato: `/var/data`
