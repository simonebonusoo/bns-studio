# Persistenza catalogo shop

Questa nota descrive dove vengono salvati i dati reali del catalogo e cosa resta persistente davvero in locale, via git e in deploy.

## Fonte di verità del catalogo

Il catalogo prodotti usa **Prisma + SQLite** come fonte di verità unica.

- File database locale predefinito: `data/shop/dev.db`
- Schema Prisma: `prisma/schema.prisma`
- Accesso server ai prodotti:
  - lettura pubblica: `src/server/shop/routes/storeRoutes.mjs`
  - create/update/delete admin: `src/server/shop/routes/adminRoutes.mjs`
  - riordino catalogo: `src/server/shop/lib/product-order.mjs`

Campi persistiti nel database:

- id
- slug
- titolo
- descrizione
- categoria
- prezzi
- formati A3/A4
- stock
- `imageUrls`
- featured
- ordini, recensioni, coupon, regole sconto e settings shop

## Dove vengono salvate le immagini prodotto

Le immagini caricate da admin vengono salvate sul filesystem locale del server.

- Directory persistente locale predefinita: `data/uploads/products/`
- URL pubblici serviti dall'app: `/uploads/products/<nome-file>`

## Strategia ambiente-based

### Locale

- database: SQLite locale
- path predefinito DB: `data/shop/dev.db`
- asset storage mode: `local`
- upload immagini: `data/uploads/products/`

### Produzione

Il progetto ora distingue esplicitamente due strategie per gli asset:

1. `ASSET_STORAGE_MODE=local`
   - usa disco persistente montato dal provider
   - consigliato su Render solo se il servizio ha un persistent disk
2. `ASSET_STORAGE_MODE=cloudinary`
   - usa Cloudinary come storage persistente per le immagini
   - evita la dipendenza dagli upload sul filesystem runtime

Per il database in produzione:

- il codice continua a supportare SQLite, ma va montato su storage persistente vero;
- in alternativa puoi puntare `DATABASE_URL` a un path persistente assoluto gestito dal provider.

Il progetto **non** supporta ancora un motore Prisma diverso da SQLite nello schema attuale, quindi per la produzione la strada compatibile e:

- SQLite su disk persistente
  oppure
- successiva migrazione schema a Postgres, se deciderai di farla

Compatibilità legacy:

- Se esistono ancora file in `src/server/uploads/products/`, il server li copia automaticamente nella nuova directory `data/uploads/products/` quando parte.

## Stato git reale

### Tracciato da git

- `data/shop/dev.db`
- `data/uploads/products/.gitkeep`
- `prisma/schema.prisma`

### Non ignorato da git

Queste path **non sono escluse** dal `.gitignore` principale:

- `data/shop/`
- `data/uploads/products/`

Questo significa che:

- il database SQLite puo essere versionato con git;
- anche le immagini uploadate possono essere versionate con git **solo se vengono aggiunte esplicitamente con `git add`**.

### Importante

Git **non** salva automaticamente i file runtime.

Quindi:

- se modifichi prodotti in locale e non fai commit del DB aggiornato, un `git clone` su un'altra macchina **non** vedra quelle modifiche;
- se carichi immagini in `data/uploads/products/` e non fai `git add` dei file immagine, un `git clone` su un'altra macchina **non** le avra.

## Cosa succede in locale

### Persistente dopo riavvio server

Si, in locale il catalogo resta persistente dopo restart perche il server legge sempre da:

- `data/shop/dev.db`
- `data/uploads/products/`

Finche questi file restano sul disco locale, i prodotti e le immagini restano disponibili.

### Persistente dopo `git add / commit / push`

Solo se includi davvero i file aggiornati nel commit:

- database: `data/shop/dev.db`
- immagini: `data/uploads/products/*`

Se fai commit solo del codice e non dei dati, git non conserva le modifiche fatte al catalogo.

### Persistente dopo `git clone` su un'altra macchina

Dipende da cosa hai versionato:

- prodotti e metadati: **si**, se `data/shop/dev.db` nel commit contiene i dati corretti;
- immagini: **si solo se** i file immagine dentro `data/uploads/products/` sono stati aggiunti al repository.

Se le immagini non sono state committate, i prodotti cloneranno i riferimenti ma i file non esisteranno sulla nuova macchina.

## Cosa succede in produzione

## Render

Il progetto contiene `render.yaml`, quindi il target di deploy attuale sembra essere Render.

Configurazione repository:

- `DATABASE_URL=file:/opt/render/project/src/data/shop/dev.db`
- `UPLOADS_DIR=/opt/render/project/src/data/uploads`

### Stato reale della persistenza su Render

Su Render, **il filesystem locale e effimero di default**. Questo significa che senza persistent disk:

- le modifiche runtime al file SQLite vengono perse a redeploy o restart;
- le immagini caricate runtime vengono perse a redeploy o restart;
- il fatto che il DB sia nel repo aiuta solo a distribuire una snapshot iniziale del catalogo, non a conservare i cambi runtime dopo il deploy.

In pratica:

- deploy iniziale: parte dal DB committato nel repo;
- modifiche admin fatte sul server: persistono solo fino al prossimo restart/redeploy, se non esiste storage persistente esterno.
- con `ASSET_STORAGE_MODE=cloudinary`, le immagini non dipendono piu dal filesystem runtime del servizio.

### Configurazione consigliata su Render

Opzione compatibile con l'architettura attuale:

- `DATABASE_URL=file:/opt/render/project/src/data/shop/dev.db`
- `UPLOADS_DIR=/opt/render/project/src/data/uploads`
- `ASSET_STORAGE_MODE=local`
- persistent disk Render montato su `/opt/render/project/src/data`

Opzione piu robusta per gli asset:

- `DATABASE_URL=file:/opt/render/project/src/data/shop/dev.db`
- `ASSET_STORAGE_MODE=cloudinary`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_UPLOAD_PRESET=...`
- `CLOUDINARY_FOLDER=bns-studio/products`

In questo caso:

- il DB resta su disk persistente;
- le immagini vanno su storage esterno persistente.

## Hardening runtime

Il backend ora esegue un controllo esplicito all'avvio:

- path `DATABASE_URL` effettivo
- path upload effettivo
- ambiente locale vs produzione
- contesto Render
- presenza di configurazione persistente dichiarata

Se il server rileva produzione senza garanzia di storage persistente:

- scrive warning chiari nei log server;
- espone lo stato runtime all'area admin;
- mostra un warning visibile nella gestione shop, solo per admin.

Questo non blocca il catalogo, ma evita la falsa impressione che il salvataggio runtime sia garantito quando il filesystem del deploy e effimero.

### Variabili utili

- `UPLOADS_DIR`: override del path immagini
- `DATABASE_URL`: override del file SQLite o del database esterno
- `ASSET_STORAGE_MODE`: `local` oppure `cloudinary`
- `CLOUDINARY_CLOUD_NAME`: nome cloud Cloudinary
- `CLOUDINARY_UPLOAD_PRESET`: upload preset Cloudinary
- `CLOUDINARY_FOLDER`: cartella destinazione opzionale su Cloudinary
- `RENDER_DISK_PATH`: mount path del disk Render, se presente
- `PERSISTENT_STORAGE_ENABLED=true`: conferma esplicita che l'ambiente usa storage persistente reale

### Quando serve storage esterno o persistent disk

Per uno shop reale in produzione serve almeno una di queste soluzioni:

1. un **persistent disk** montato su Render sotto:
   - `/opt/render/project/src/data`
   - oppure almeno `/opt/render/project/src/data/uploads`
2. meglio ancora:
   - database gestito esterno per i prodotti
   - object storage esterno per le immagini

Senza una di queste due soluzioni, la persistenza in produzione **non e garantita** dopo redeploy.

## Backup consigliato

### Backup minimo locale

Salva periodicamente:

- `data/shop/dev.db`
- `data/uploads/products/`

### Backup via git

Possibile, ma solo se:

- committi il file SQLite aggiornato;
- committi anche le immagini aggiornate.

Non e ideale per una produzione attiva, ma funziona come snapshot manuale del catalogo.

### Backup consigliato per produzione

- dump del database o copia del file SQLite
- archivio della cartella immagini
- salvataggio off-machine

## Migrazione su un'altra macchina

Per spostare il catalogo completo su un altro ambiente locale:

1. copia `data/shop/dev.db`
2. copia `data/uploads/products/`
3. mantieni gli stessi path relativi nel progetto
4. avvia il server normalmente

Se usi git come trasporto:

1. committa `data/shop/dev.db`
2. committa le immagini in `data/uploads/products/`
3. fai push
4. clona il repository sull'altra macchina

## Conclusione pratica

Persistenza realmente garantita oggi:

- **locale dopo restart**: si
- **git clone su altra macchina**: solo per i file realmente committati
- **deploy/redeploy su Render senza disk**: no, non e garantita

Per avere persistenza reale in produzione devi aggiungere storage persistente per:

- database
- immagini
