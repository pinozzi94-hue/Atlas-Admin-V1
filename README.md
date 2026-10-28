# Atlas Admin — Pannello amministrativo Node.js

Dashboard amministrativa full-stack, responsive e in italiano. È pensata come base personalizzabile da pubblicare su GitHub e poi collegare alla propria applicazione.

> **Importante:** questa repository contiene un progetto iniziale funzionante con dati dimostrativi. Non è collegata a un negozio, a un gateway di pagamento, a un servizio email o a un sistema utenti esterno. Prima di esporla su Internet, completa i passaggi della sezione **Sicurezza e produzione**.

## Funzioni incluse

- **Dashboard:** riepilogo di ricavi registrati, ordini, utenti, prodotti, attività recenti, prodotti con scorte basse e grafico degli ultimi 7 giorni.
- **Utenti:** crea, consulta, modifica, cerca, filtra ed elimina record; ruoli e stati demo.
- **Prodotti:** catalogo, SKU univoco, categoria, prezzo, scorte e stato.
- **Ordini:** stato ordine, cliente, email, totale e data.
- **Contenuti:** gestione di titoli, slug, autori e stato di pubblicazione.
- **Assistenza:** ticket, priorità e stato di lavorazione.
- **Report & analisi:** indicatori aggregati calcolati dai dati presenti.
- **Registro attività:** audit log in sola lettura per le principali operazioni amministrative.
- **Impostazioni:** nome sito, URL, email di supporto, fuso orario, valuta, elementi per pagina, preferenze di notifica e modalità manutenzione.
- **Ricerca globale**, filtri, paginazione, dialoghi di conferma e **esportazione CSV**.
- **Autenticazione admin** lato server, password verificata con bcrypt, sessione firmata, token CSRF per le operazioni di scrittura e limitazione dei tentativi di login.
- **Persistenza locale:** i dati vengono salvati in `data/database.json` e sopravvivono ai riavvii del server.
- Layout responsive per desktop e dispositivi mobili.

Le preferenze email e modalità manutenzione sono valori di configurazione: per inviare davvero email o mettere in manutenzione un sito pubblico occorre collegare un provider e implementare la logica dell'applicazione.

## Requisiti

- Node.js **20 o successivo** (consigliata una release LTS supportata)
- npm, incluso nell'installazione standard di Node.js

## Avvio rapido su Windows

1. Estrai lo ZIP in una cartella.
2. Installa Node.js LTS da [nodejs.org](https://nodejs.org/) se non è già installato.
3. Fai doppio clic su `start.bat`.
4. Al primo avvio, lo script crea `.env`, installa le dipendenze e apre il browser su `http://127.0.0.1:3000`.
5. Accedi con le credenziali demo riportate sotto.

Credenziali demo locali:

- **Utente:** `admin`
- **Password:** `Admin123!`

Queste credenziali servono solo per provare il progetto in locale. Cambiale prima di pubblicare o rendere raggiungibile il server.

## Avvio manuale

Apri un terminale nella cartella del progetto ed esegui:

```bash
# Windows PowerShell o macOS/Linux
cp .env.example .env
npm install
npm start
```

Su Windows PowerShell, se `cp` non è disponibile, usa `Copy-Item .env.example .env`.

Per lo sviluppo con riavvio automatico:

```bash
npm run dev
```

Per controllare la sintassi di base del server:

```bash
npm run check
```

## Configurazione `.env`

Le variabili principali sono:

| Variabile | Significato |
| --- | --- |
| `NODE_ENV` | `development` in locale; `production` sul server pubblico |
| `HOST` | `127.0.0.1` in locale; imposta `0.0.0.0` quando il provider richiede il binding su tutte le interfacce |
| `PORT` | Porta HTTP, predefinita `3000` |
| `ADMIN_USERNAME` | Nome utente dell'amministratore |
| `ADMIN_PASSWORD` | Password iniziale dell'amministratore |
| `SESSION_SECRET` | Segreto usato per firmare le sessioni |
| `DATA_FILE` | Percorso del file JSON persistente |

In produzione, il server rifiuta di avviarsi se trova il segreto demo o una password troppo debole. Genera un segreto nuovo, ad esempio con:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Non condividere il file `.env` e **non caricarlo su GitHub**: è già escluso da `.gitignore`. Modifica anche le credenziali demo. La password viene verificata tramite bcrypt; il file `.env` contiene comunque la password di configurazione in chiaro, quindi proteggi l'accesso all'ambiente del server.

## Pubblicazione su GitHub

1. Crea un nuovo repository GitHub.
2. Carica i file del progetto senza `node_modules/`, `.env` o `data/database.json`.
3. Aggiungi un README aggiornato e scegli una licenza appropriata (il progetto include una licenza MIT iniziale).
4. Configura le variabili d'ambiente direttamente nel tuo hosting.

**GitHub Pages non esegue un server Node.js.** Per rendere operativo il pannello serve un servizio che esegua Node.js (ad esempio un VPS o un hosting Node compatibile). Imposta sul provider `NODE_ENV=production`, `HOST=0.0.0.0`, un `PORT` compatibile con il provider, `ADMIN_USERNAME`, una `ADMIN_PASSWORD` robusta e un `SESSION_SECRET` casuale.

## API incluse

Le API sono servite dallo stesso processo Express e richiedono una sessione amministrativa, eccetto health check e gli endpoint di accesso/sessione.

| Endpoint | Uso |
| --- | --- |
| `GET /api/health` | Health check |
| `GET /api/auth/session` | Stato sessione corrente |
| `POST /api/auth/login` | Accesso amministratore |
| `POST /api/auth/logout` | Logout, con token CSRF |
| `GET /api/overview` | Indicatori dashboard |
| `GET /api/data/:collection` | Elenco record (`users`, `products`, `orders`, `posts`, `tickets`, `logs`) |
| `POST /api/data/:collection` | Crea record nelle sezioni gestibili |
| `PUT /api/data/:collection/:id` | Modifica record |
| `DELETE /api/data/:collection/:id` | Elimina record |
| `GET /api/settings` | Legge impostazioni |
| `PATCH /api/settings` | Aggiorna impostazioni con token CSRF |
| `GET /api/export/:collection` | Esporta CSV |

Il token CSRF viene restituito dalla sessione di login e deve essere inviato nell'header `X-CSRF-Token` per le richieste che modificano dati.

## Struttura del progetto

```text
atlas-admin/
├── public/
│   ├── app.js          # interfaccia e interazioni browser
│   ├── index.html      # layout della dashboard e login
│   ├── styles.css      # design responsive
│   └── favicon.svg
├── data/
│   └── .gitkeep        # directory dati vuota nel repository
├── .env.example        # modello di configurazione non segreto
├── .gitignore
├── LICENSE
├── package.json
├── server.js           # API, autenticazione e persistenza
├── start.bat           # avvio rapido Windows
└── start.sh            # avvio rapido macOS/Linux
```

## Sicurezza e produzione

Questa è una base di partenza, non una certificazione di sicurezza o un sistema enterprise già pronto per gestire dati reali. Prima di usarla in produzione:

- sostituisci l'archivio JSON con PostgreSQL, MySQL o un altro database gestito, soprattutto se il provider usa filesystem effimeri o più istanze;
- sostituisci `cookie-session` con uno store server-side adatto al deployment se ti servono revoca immediata, sessioni centralizzate o più istanze; usa HTTPS e verifica la configurazione proxy del provider;
- prevedi backup, migrazioni, monitoraggio, policy di conservazione e test di ripristino;
- aggiungi gestione utenti amministratori separata, inviti, recupero password, ruoli e permessi granulari, MFA e una procedura per ruotare credenziali;
- implementa le integrazioni reali per pagamenti, email, notifiche, ordini, catalogo e ticket; i record attuali sono dati demo locali;
- verifica le implicazioni GDPR/privacy, la registrazione degli accessi e i dati personali prima di trattare informazioni vere.

Il file `data/database.json` è escluso da Git per evitare la pubblicazione accidentale dei dati runtime. Se scegli consapevolmente di versionare dati demo, controlla prima che non contengano informazioni personali o segreti.

## Licenza

Distribuito secondo la licenza MIT inclusa nel file `LICENSE`.
