# Storage immagini shop

Il progetto supporta due modalita per gli asset prodotto.

## 1. Modalita locale

Valore:

```env
ASSET_STORAGE_MODE=local
```

Comportamento:

- gli upload admin vengono salvati in `data/uploads/products/` in locale
- su Render, con disk persistente, vengono salvati sotto `/var/data/uploads/products/`
- il database salva URL del tipo `/uploads/products/<file>`

Questa modalita resta pienamente compatibile con il catalogo esistente.

## 2. Modalita cloud

Valore:

```env
ASSET_STORAGE_MODE=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_UPLOAD_PRESET=...
CLOUDINARY_FOLDER=bns-studio/products
```

Comportamento:

- gli upload admin non vengono salvati sul filesystem locale
- le immagini vengono caricate su Cloudinary
- il database salva direttamente i `secure_url`

## Migrazione immagini esistenti al cloud

Se hai gia immagini locali in `/uploads/products/...`, puoi migrare gli URL nel DB verso Cloudinary con:

```bash
npm run shop:assets:migrate-cloudinary -- --force
```

Il comando:

- legge i prodotti reali dal DB
- trova le immagini locali ancora referenziate
- le carica su Cloudinary usando lo stesso layer del backend
- aggiorna il DB con gli URL cloud

## Compatibilita

- le immagini locali gia esistenti continuano a funzionare
- la migrazione al cloud non e obbligatoria
- il passaggio puo essere fatto in modo progressivo

## Note operative

- `ASSET_STORAGE_MODE=cloudinary` senza env complete genera warning runtime
- le immagini remote legacy non vengono scaricate automaticamente nel mirror: il mirror salva file `.url` come riferimento
