# Backup e restore dello shop

Questa guida documenta il backup e il restore del catalogo shop senza cambiare l'architettura attuale.

## Cosa viene salvato nel backup

Ogni backup include:

- database SQLite dello shop
- upload locali prodotto
- mirror file-based `Prodotti/`

Percorsi reali coperti:

- DB: `data/shop/dev.db` in locale, `/var/data/shop/dev.db` su Render
- upload: `data/uploads/` in locale, `/var/data/uploads/` su Render
- mirror catalogo: `data/Prodotti/` in locale, `/var/data/Prodotti/` su Render

## Comando backup

```bash
npm run shop:backup
```

Il comando crea un backup timestampato sotto:

- locale: `data/backups/shop/<timestamp>/`
- Render: `/var/data/backups/shop/<timestamp>/`

Dentro il backup trovi:

- `manifest.json`
- `shop-db/`
- `uploads/`
- `Prodotti/`

## Comando restore

```bash
npm run shop:restore -- /percorso/del/backup --force
```

Se non passi un path esplicito, il comando usa l'ultimo backup disponibile.

### Protezioni incluse

- il restore richiede sempre `--force`
- prima di sovrascrivere i dati attuali crea automaticamente un `pre-restore-<timestamp>/`

## Limiti operativi

- il restore e pensato per `DATABASE_URL=file:...`
- prima del restore e consigliato fermare il server, per evitare scritture concorrenti sul DB SQLite

## Strategia consigliata

### Locale

- esegui `npm run shop:backup` prima di modifiche importanti
- usa git solo come snapshot manuale aggiuntiva

### Produzione

- esegui backup periodici sul persistent disk
- copia periodicamente i backup fuori macchina

## Cosa non fa automaticamente

- non fa push su git
- non sincronizza backup su cloud storage esterno
- non committa dati nel repository

Per versionare i backup su git serve sempre:

```bash
git add ...
git commit -m "backup shop"
git push
```
