# Backup e restore dello shop

Questa guida documenta il backup e il restore del catalogo shop senza cambiare l'architettura attuale.

## Cosa viene salvato nel backup

Ogni backup include:

- database SQLite dello shop
- upload locali prodotto

Percorsi reali coperti:

- DB: `data/shop/dev.db` in locale, `/var/data/shop/dev.db` su Render
- upload: `data/uploads/` in locale, `/var/data/uploads/` su Render

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

## Comando restore

```bash
npm run shop:restore -- /percorso/del/backup --force
```

Se non passi un path esplicito, il comando usa l'ultimo backup disponibile.

Puoi anche usare una forma esplicita piu chiara:

```bash
npm run shop:restore -- --source /percorso/del/backup --force
```

Alias supportato:

```bash
npm run shop:restore -- --backup /percorso/del/backup --force
```

### Protezioni incluse

- il restore richiede sempre `--force`
- prima di sovrascrivere i dati attuali crea automaticamente un `pre-restore-<timestamp>/`
- il restore ripristina lo **stesso file SQLite usato dal runtime**, risolto con `resolve-database-url.mjs`
- se presenti, vengono gestiti anche eventuali file SQLite sidecar `-wal` e `-shm`
- i `pre-restore-*` non vengono scelti automaticamente come sorgente restore normale
- i safety backup sono comunque nel formato standard completo e possono essere usati solo se selezionati esplicitamente

## Limiti operativi

- il restore e pensato per `DATABASE_URL=file:...`
- prima del restore e consigliato fermare il server, per evitare scritture concorrenti sul DB SQLite
- dopo il restore devi riavviare il server shop, cosi Prisma riapre la connessione sul database ripristinato
- se il backup selezionato non e valido, il comando mostra i motivi precisi del fallimento

## Fonte di verita reale

La fonte di verita dello shop e una sola:

- database SQLite/Prisma

Gli upload immagine fanno parte del restore perche servono davvero al catalogo.

L'eventuale cartella `data/Prodotti/` non fa piu parte del flusso critico di backup/restore e non viene usata per ricostruire il catalogo runtime.

## Seed e restart

Il bootstrap del backend continua a eseguire `prisma db push` e `prisma/seed.mjs`, ma il seed ora lavora in modalita `if-empty`:

- database vuoto -> crea i dati iniziali
- database gia popolato o ripristinato -> non reinserisce prodotti/default demo

Questo evita che un restore valido venga alterato dal seed al restart.

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
