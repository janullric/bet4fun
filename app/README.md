# Bet4Fun

Prototipo mobile di pronostici sportivi gratuiti — React + Vite.

## Avvio in locale

```bash
npm install
npm run dev
```

Apre automaticamente http://localhost:5173.

## Build di produzione

```bash
npm run build     # genera la cartella dist/
npm run preview   # serve la build in locale per verifica
```

## Deploy

Il progetto è già configurato per i principali host statici (SPA con React Router):

- **Vercel** — `vercel.json` include il rewrite `/* → /index.html`. Drag & drop della cartella o `vercel deploy`.
- **Netlify** — `public/_redirects` gestisce il fallback SPA. Trascina `dist/` o collega il repo.
- **Cloudflare Pages / GitHub Pages** — comando build: `npm run build`, output: `dist`.

## Struttura

```
src/
├── main.jsx              # entry point
├── App.jsx               # router + layout
├── index.css             # stili globali (reset + animazioni)
├── theme.js              # tokens di design (colori, font, ombre)
├── context/
│   └── AppContext.jsx    # stato globale (funnies, user)
├── components/           # componenti riutilizzabili
│   ├── DeviceFrame.jsx   # cornice iPhone per desktop
│   ├── Funnie.jsx        # moneta del gioco
│   ├── Icon.jsx          # set di icone SVG
│   ├── LeaderRow.jsx     # riga classifica
│   ├── Screen.jsx        # layout schermata con header
│   ├── SectionHeader.jsx # titolo di sezione
│   ├── StatusBar.jsx     # barra di stato iOS
│   ├── Stripe.jsx        # placeholder grafico
│   ├── TabBar.jsx        # bottom navigation
│   ├── TweaksPanel.jsx   # pannello dev per saltare tra schermate
│   └── Wordmark.jsx      # logo testuale Bet4Fun
└── screens/              # una schermata per file
    ├── HomePublic.jsx    # landing pubblica
    ├── Iscrizione.jsx    # signup multi-step
    ├── Dashboard.jsx     # home utente loggato
    ├── PronosticiList.jsx
    ├── Schedina.jsx      # pronostica una manche
    ├── Classifiche.jsx
    ├── Premi.jsx
    └── Profilo.jsx
```

## Come modificare

- **Colori / font** → `src/theme.js`
- **Testi / dati demo** → dentro alla schermata corrispondente in `src/screens/`
- **Aggiungere una schermata** → crea un file in `src/screens/` e registralo in `src/App.jsx`
- **Rotte** → definite in `src/App.jsx` con `react-router-dom`

## Note

- Il prototipo è pensato **mobile-first** (390×844). Su desktop l'app è mostrata
  in una cornice iPhone; su schermi stretti (<600px) occupa tutto lo schermo.
- Il tasto ✦ in basso a destra apre il pannello *Tweaks* — utile in sviluppo
  per saltare velocemente tra schermate. Puoi nasconderlo impostando la variabile
  d'ambiente `VITE_SHOW_TWEAKS=false` prima di `npm run build`.
