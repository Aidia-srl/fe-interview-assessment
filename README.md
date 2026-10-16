# Mock API — Servizio Newsletter Compleanni

Server REST volatile su `localhost`. Tutti i dati sono **in-memory**: le modifiche vanno perse al riavvio del processo (o ripristinate con `POST /api/__reset`).

## Avvio

```bash
npm install
npm run dev        # parte su http://localhost:3001, con watch
```

Il server abilita CORS per qualunque origine e simula una latenza di rete di 150–450 ms per ogni richiesta.

Nel frontend configurate il base URL tramite variabile d'ambiente (es. `NEXT_PUBLIC_API_BASE_URL` o `NUXT_PUBLIC_API_BASE_URL`) e usate l'URL **assoluto** `http://localhost:3001` anche in SSR.

## Riepilogo endpoint

| Metodo | Path | Descrizione |
| --- | --- | --- |
| GET | `/api/offices` | Elenco sedi (per filtri e select) |
| GET | `/api/teams` | Elenco team (per filtri e select) |
| GET | `/api/employees` | Lista dipendenti: ricerca, filtri, ordinamento, paginazione |
| POST | `/api/employees` | Creazione dipendente |
| PATCH | `/api/employees/:id` | Modifica parziale (incluso `active`) |
| DELETE | `/api/employees/:id` | Eliminazione |
| GET | `/api/birthdays/today` | Festeggiati di oggi (solo dipendenti attivi) |
| POST | `/api/newsletter/send` | Trigger invio giornaliero |
| GET | `/api/newsletter/sends` | Storico invii (paginato) |
| GET | `/api/newsletter/sends/:id` | Dettaglio di un invio |
| POST | `/api/__reset` | Ripristina i dati iniziali (solo mock) |

--- 

### `GET /api/employees`

Query parameters (tutti opzionali):

| Parametro | Valori | Default |
| --- | --- | --- |
| `search` | testo libero su nome, cognome, email (case-insensitive) | — |
| `officeId` | id sede, es. `office-milano` | — |
| `teamId` | id team, es. `team-engineering` | — |
| `active` | `true` / `false` | tutti |
| `sortBy` | `firstName` `lastName` `email` `birthDate` `createdAt` | `firstName` |
| `sortDir` | `asc` / `desc` | `asc` |
| `page` | intero ≥ 1 | `1` |
| `pageSize` | intero 1–100 | `10` |

Parametri non validi → `400` con elenco errori. Ricerca, filtri, ordinamento e paginazione sono **server-side**: la risposta è un envelope `Paginated<Employee>`.

### `POST /api/employees`

Body JSON: `{ firstName, lastName, email, birthDate, officeId, teamId, active? }`.
`active` omesso = `true`.

- `201` → restituisce il dipendente creato
- `400` → validazione (campi obbligatori, formato email, data reale non futura, `officeId`/`teamId` esistenti)
- `409` → email già in uso

### `PATCH /api/employees/:id`

Body JSON con un sottoinsieme dei campi modificabili (es. `{ active: false }` per la disattivazione). Controlli di validazione come per la creazione, email unica a esclusione del dipendente stesso.

- `200` → dipendente aggiornato · `404` → id sconosciuto · `400` / `409` → validazione

### `DELETE /api/employees/:id`

`204` senza body · `404` → id sconosciuto.

### `GET /api/birthdays/today`

`200` → `{ date: "YYYY-MM-DD", birthdays: BirthdayPerson[] }`. I dipendenti inattivi non compaiono mai. Il seed garantisce **sempre 3 festeggiati ogni giorno**, con età diverse, così la dashboard non è mai vuota.

### `POST /api/newsletter/send`

Trigger manuale dell'invio giornaliero. Non c'è controllo di idempotenza: ogni chiamata crea una nuova voce nello storico.

- Con festeggiati: `201` → `{ status: "sent", recipientCount, birthdays, recipients, ... }`. I destinatari sono tutti i dipendenti attivi **esclusi** i festeggiati.
- Senza festeggiati: `201` → `{ status: "skipped", reason: "no_birthdays", recipientCount: 0, ... }`.

L'esito completo è nel body della risposta.

### `GET /api/newsletter/sends` e `GET /api/newsletter/sends/:id`

Storico in ordine di invio decrescente, paginato con `page`/`pageSize`. La lista restituisce i **sommari** (senza `birthdays` e `recipients`); il dettaglio restituisce l'oggetto `NewsletterSend` completo. 

## Formato degli errori

```json
{
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email already in use" },
    { "field": "birthDate", "message": "Birth date cannot be in the future" }
  ]
}
```

Per gli errori generici (404) è presente solo `message`.

## Esempi con curl

```bash
# Lista filtrata e ordinata
curl "http://localhost:3001/api/employees?search=mar&officeId=office-milano&active=true&sortBy=lastName&sortDir=desc&page=2&pageSize=5"

# Creazione
curl -X POST http://localhost:3001/api/employees \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Anna","lastName":"Neri","email":"anna.neri@example.com","birthDate":"1990-05-05","officeId":"office-roma","teamId":"team-marketing"}'

# Disattivazione
curl -X PATCH http://localhost:3001/api/employees/emp-001 \
  -H 'Content-Type: application/json' -d '{"active":false}'

# Trigger invio
curl -X POST http://localhost:3001/api/newsletter/send
```
