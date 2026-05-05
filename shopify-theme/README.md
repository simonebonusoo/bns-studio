# BNS Studio Shopify Theme

Tema Shopify separato dal progetto React/Node/Prisma live.

## Contenuto

Questa cartella contiene solo file Shopify theme:

- `layout/`
- `templates/`
- `sections/`
- `snippets/`
- `assets/`
- `config/`
- `locales/`

Non richiede il backend custom del progetto corrente.

## Pubblicazione in un repo Shopify separato

1. Crea un nuovo repository GitHub dedicato al tema Shopify.
2. Copia tutto il contenuto della cartella `shopify-theme/` dentro la root di quel repository.
3. Esempio struttura finale del nuovo repo:

```text
layout/
templates/
sections/
snippets/
assets/
config/
locales/
README.md
```

4. Fai push del repository su GitHub.

## Collegamento da Shopify

1. Apri Shopify Admin.
2. Vai in `Online Store > Themes`.
3. Clicca `Add theme`.
4. Scegli `Connect from GitHub`.
5. Seleziona il repository dedicato al tema.
6. Seleziona il branch corretto e importa il tema.

## Note

- Homepage, header, footer, card prodotto, pagina prodotto, collezione e cart drawer sono realizzati con componenti Shopify-native.
- Le logiche custom del progetto attuale non sono state migrate: checkout custom, auth custom, Prisma, coupon custom e pricing custom non fanno parte di questo tema.
- Per il catalogo Shopify usa collezioni, prodotti, media, varianti e carrello nativi.

## File chiave

- `layout/theme.liquid`
- `templates/index.json`
- `templates/product.json`
- `templates/collection.json`
- `sections/header.liquid`
- `sections/footer.liquid`
- `sections/main-product.liquid`
- `sections/main-collection.liquid`
- `sections/cart-drawer.liquid`
- `assets/theme.css`
- `assets/theme.js`
