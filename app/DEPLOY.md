# Deploy su Vercel + hardening

Guida pratica per mettere online Bet4Fun — frontend su Vercel, database su Supabase. Zero server da gestire, zero backend custom. Tempo totale: ~15 minuti la prima volta.

## 1. Prerequisiti

- [x] Progetto Supabase creato e SQL di `SUPABASE_SETUP.md` eseguito (sezioni 1–7).
- [x] Account [Vercel](https://vercel.com) (puoi loggarti con GitHub).
- [x] Repository GitHub con il codice (anche privato).

## 2. Prima messa online su Vercel

1. Vai su [vercel.com/new](https://vercel.com/new), **Import Git Repository** e seleziona il tuo repo `bet4fun`.
2. **Root Directory** → imposta `app` (il frontend vive in quella sottocartella).
3. Vercel rileva da solo Vite. Lascia i default:
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Environment Variables**, aggiungi:
   - `VITE_SUPABASE_URL` → l'URL del progetto Supabase
   - `VITE_SUPABASE_ANON_KEY` → la anon/public key

   Metti entrambe su tutti gli ambienti (Production, Preview, Development).
5. **Deploy**. In ~60 secondi hai un URL `bet4fun-xxxx.vercel.app`.

Il file `vercel.json` già presente in `app/` riscrive tutte le route a `index.html`, così il client routing di react-router funziona anche su reload diretti.

## 3. Hardening prima di aprire al pubblico

### 3.1 Supabase → produzione, non sviluppo

Il blocco SQL in `SUPABASE_SETUP.md` contiene `drop table ... cascade` in testa. **Rimuovilo** prima del primo deploy live, o non potrai più rifare il setup senza perdere i dati.

### 3.2 Riattiva *Confirm email*

In Supabase: **Authentication → Providers → Email → Confirm email** → ON.

In dev l'avevi spenta per comodità; in prod evita account fantasma.

### 3.3 Limita il dominio

- Supabase → **Authentication → URL Configuration**:
  - Site URL: `https://tuo-dominio.com`
  - Redirect URLs: `https://tuo-dominio.com/**`
- Aggiungi anche il dominio Vercel di preview se lo usi per testing.

### 3.4 Verifica RLS

Le policy sono già in `SUPABASE_SETUP.md`, ma controlla una per una in Supabase → **Database → Tables**, tab Policies:

- `profiles`: self-select, self-update (no insert client)
- `bets` / `bet_picks`: self-select (insert via RPC)
- `groups` / `group_members`: member-select only
- `lead_campaigns`: public read (solo `active = true`)
- `lead_submissions`: self-select
- `user_consents`: self-select

Tutte le scritture passano dalle RPC `security definer`, che fanno i check di consenso e autenticazione.

### 3.5 Rate limiting Supabase

Supabase applica rate limit di default su `auth.signUp` e RPC. Se apri al pubblico, controlla in **Settings → API → Rate Limit** e alza/abbassa se necessario.

### 3.6 Secret in chiaro = solo la anon key

La `VITE_SUPABASE_ANON_KEY` è **pubblica per design** — finisce nel bundle JS. La sicurezza la fa RLS, non la chiave. **Non** mettere mai la `service_role` key in variabili `VITE_*`: quelle vengono incluse nel bundle client.

## 4. Dominio custom

1. Su Vercel → **Settings → Domains** → Add.
2. Aggiungi `bet4fun.example`.
3. Vercel ti dà i record DNS (A o CNAME).
4. Aggiornali dal tuo registrar. 5-30 minuti per la propagazione.
5. Torna in Supabase e aggiorna Site URL al dominio definitivo (punto 3.3).

## 5. Monitoring e alerting

- **Vercel Analytics** (gratis, Settings → Analytics): ti mostra traffico reale.
- **Supabase Logs** (Dashboard → Logs): query lente e RPC errors.
- **Health check**: `GET https://tuo-dominio.com/` — se risponde 200 con l'index Vite, sei up.

## 6. Costi (ordine di grandezza, aprile 2026)

| Componente  | Free tier                     | Primo piano a pagamento         |
|-------------|-------------------------------|---------------------------------|
| Vercel      | 100 GB bandwidth/mese, 1 dev  | Pro $20/mese                    |
| Supabase    | 500 MB DB, 2 GB bandwidth     | Pro $25/mese (8 GB DB, 250 GB)  |
| Dominio     | —                             | ~€10–15/anno                    |

Con il free tier reggi tranquillamente un paio di centinaia di utenti attivi al giorno.

## 7. Deploy successivi

Dopo il primo setup, ogni `git push` su `main` scatena un deploy automatico su Vercel. Per un hotfix rapido:

```
git commit -am "fix: XYZ"
git push
```

Vercel ricompila in ~40s e ti pubblica il nuovo bundle.

## 8. Rollback

Se il deploy rompe qualcosa: **Vercel Dashboard → Deployments → [commit precedente] → Promote to Production**. Zero downtime.

## 9. Checklist finale pre-lancio

- [ ] `drop table ... cascade` rimosso dal SQL di produzione
- [ ] Email confirm riattivata
- [ ] Site URL + Redirect URLs in Supabase su dominio reale
- [ ] Tutte le policy RLS verificate
- [ ] Solo `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nelle env Vercel (niente `service_role`)
- [ ] Privacy policy e ToS pubblicati su una landing (anche solo un `/legal.html` statico) e linkati nella pagina di iscrizione
- [ ] Cookie banner / cookie policy (ti serve per GDPR se tracci analytics)
- [ ] Contatto `privacy@tuo-dominio` attivo per esercizio diritti GDPR
- [ ] Test end-to-end: signup → submit bet → submit lead → consensi toggle → signout

Fatta la checklist, apri al pubblico e iniziano a girare utenti veri.
