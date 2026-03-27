# Monitoring shop

Il progetto usa ora un layer minimo di monitoring strutturato lato server.

## Cosa registra

Vengono registrati almeno:

- errori backend API shop/admin/orders
- errori di upload immagini
- warning di persistenza runtime
- errori backup/restore
- errori di migrazione immagini al cloud
- eccezioni di processo (`unhandledRejection`, `uncaughtException`)

## Dove finiscono i log

Path predefiniti:

- locale: `data/logs/`
- Render con disk persistente: `/var/data/logs/`

Formato:

- file JSONL giornalieri tipo `shop-YYYY-MM-DD.jsonl`

Ogni riga contiene:

- timestamp
- livello (`info`, `warn`, `error`)
- evento
- contesto utile
- dettagli errore serializzati, se presenti

## Eventi principali

Esempi:

- `api_request_failed`
- `asset_storage_upload_failed`
- `persistence_warning`
- `shop_backup_created`
- `shop_backup_failed`
- `shop_restore_executed`
- `shop_restore_failed`
- `product_images_cloud_migration_completed`
- `product_images_cloud_migration_failed`

## Variabili env

Opzionali:

```env
MONITORING_DIR=/var/data/logs
MONITORING_SENTRY_DSN=
```

Al momento `MONITORING_SENTRY_DSN` e solo una preparazione di configurazione: il progetto usa gia log strutturati persistenti, senza dipendere da un provider esterno.

## Come leggere i log

Esempio:

```bash
tail -f data/logs/shop-$(date +%F).jsonl
```

Su Render:

```bash
tail -f /var/data/logs/shop-YYYY-MM-DD.jsonl
```
