import { useCallback, useEffect, useMemo, useState } from 'react';
import Screen from '../components/Screen.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useApp } from '../context/AppContext.jsx';
import { LEAGUES, fetchTheSportsDBRound } from '../lib/sportsApi.js';
import { CONTESTS } from '../lib/contests.js';

// Pannello admin minimale: inserimento risultati, chiusura giornata,
// distribuzione monte premi e impostazione kickoff. Per tutto il resto
// (utenti, consensi, tabelle arbitrarie, sql crudo) si usa Supabase Studio:
// dashboard → Table editor / SQL editor. Questo pannello copre i flussi
// ricorrenti legati al gameplay.
export default function Admin() {
  const {
    isAdmin, isAuthed, isSupabaseConfigured,
    adminSetMatchResult, adminSettleRound, adminDistributeRound, adminSetRoundPot,
    adminCloseRound,
    adminListLeadCampaigns, adminUpsertLeadCampaign,
    adminToggleLeadCampaign, adminDeleteLeadCampaign,
    adminListFixtures, adminUpsertFixture, adminDeleteFixture,
    bootstrapAdmin,
  } = useApp();

  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const wrap = (fn) => async (...args) => {
    setMsg(null); setErr(null); setBusy(true);
    try {
      const out = await fn(...args);
      setMsg('Fatto.');
      return out;
    } catch (e) {
      setErr(e?.message || 'Errore.');
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Admin" subtitle="Solo su Supabase configurato">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.7)' }}>
          Collega Supabase per usare il pannello admin.
        </div>
      </Screen>
    );
  }

  if (!isAuthed) {
    return (
      <Screen title="Admin" subtitle="Accedi">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.7)' }}>
          Devi prima fare il login.
        </div>
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen title="Admin" subtitle="Sblocca con passphrase master">
        <div style={{ padding: '0 22px 30px' }}>
          <BootstrapAdminForm bootstrap={bootstrapAdmin} />
        </div>
      </Screen>
    );
  }

  return (
    <Screen title="Admin" subtitle="Gestione risultati e monte premi">
      {(msg || err) && (
        <div style={{ padding: '0 22px 10px' }}>
          {msg && <div style={{ color: '#3DDC97', fontSize: 13 }}>{msg}</div>}
          {err && <div style={{ color: '#FF5A6A', fontSize: 13 }}>{err}</div>}
        </div>
      )}

      <SectionHeader title="Chiudi giornata (auto)" />
      <div style={{ padding: '0 22px 20px' }}>
        <CloseRoundForm onClose={adminCloseRound} />
      </div>

      <SectionHeader title="Risultato ufficiale" />
      <div style={{ padding: '0 22px 20px' }}>
        <MatchResultForm onSubmit={wrap(adminSetMatchResult)} busy={busy} />
      </div>

      <SectionHeader title="Monte premi e kickoff" />
      <div style={{ padding: '0 22px 20px' }}>
        <RoundPotForm onSubmit={wrap(adminSetRoundPot)} busy={busy} />
      </div>

      <SectionHeader title="Chiudi la giornata" />
      <div style={{ padding: '0 22px 30px' }}>
        <RoundSettleForm
          onSettle={wrap(adminSettleRound)}
          onDistribute={wrap(adminDistributeRound)}
          busy={busy}
        />
      </div>

      <SectionHeader title="Giornate & partite" />
      <div style={{ padding: '0 22px 30px' }}>
        <FixturesAdmin
          list={adminListFixtures}
          upsert={wrap(adminUpsertFixture)}
          rawUpsert={adminUpsertFixture}
          remove={wrap(adminDeleteFixture)}
          busy={busy}
        />
      </div>

      <SectionHeader title="Campagne Lead Boost" />
      <div style={{ padding: '0 22px 30px' }}>
        <LeadCampaignsAdmin
          list={adminListLeadCampaigns}
          upsert={wrap(adminUpsertLeadCampaign)}
          toggle={wrap(adminToggleLeadCampaign)}
          remove={wrap(adminDeleteLeadCampaign)}
          busy={busy}
        />
      </div>

      <SectionHeader title="Per tutto il resto" />
      <div style={{ padding: '0 22px 40px', color: 'rgba(245,246,250,0.7)', fontSize: 13, lineHeight: 1.5 }}>
        Gestione utenti, consensi, campagne Lead Boost, tabelle SQL arbitrarie:
        usa direttamente <strong>Supabase Studio</strong> → il tuo progetto →
        <em> Table editor</em> (CRUD visuale) o <em>SQL editor</em> (query ad hoc).
        Questo pannello è pensato solo per i flussi ricorrenti del gameplay.
      </div>
    </Screen>
  );
}

function MatchResultForm({ onSubmit, busy }) {
  const [kind, setKind] = useState('match');
  const [eventId, setEventId] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [round, setRound] = useState('');
  const [outcome, setOutcome] = useState('1');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [race, setRace] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const base = { event_id: eventId.trim(), league_id: leagueId.trim(), round: round ? Number(round) : null, kind };
    if (kind === 'match') onSubmit({ ...base, outcome });
    else if (kind === 'score') onSubmit({ ...base, home_goals: Number(home), away_goals: Number(away) });
    else onSubmit({ ...base, race_positions: race.split(',').map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <form onSubmit={submit} style={formGrid}>
      <Field label="Tipo">
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={input}>
          <option value="match">Match (1X2)</option>
          <option value="score">Risultato esatto</option>
          <option value="race">Ordine di arrivo</option>
        </select>
      </Field>
      <Field label="Event ID (TheSportsDB)">
        <input value={eventId} onChange={(e) => setEventId(e.target.value)} required style={input} />
      </Field>
      <Field label="League ID">
        <input value={leagueId} onChange={(e) => setLeagueId(e.target.value)} required style={input} />
      </Field>
      <Field label="Round (opzionale)">
        <input value={round} onChange={(e) => setRound(e.target.value)} type="number" style={input} />
      </Field>
      {kind === 'match' && (
        <Field label="Esito 1X2">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)} style={input}>
            <option value="1">1 — Casa</option>
            <option value="X">X — Pareggio</option>
            <option value="2">2 — Trasferta</option>
          </select>
        </Field>
      )}
      {kind === 'score' && (
        <>
          <Field label="Gol casa"><input value={home} onChange={(e) => setHome(e.target.value)} type="number" required style={input} /></Field>
          <Field label="Gol trasferta"><input value={away} onChange={(e) => setAway(e.target.value)} type="number" required style={input} /></Field>
        </>
      )}
      {kind === 'race' && (
        <Field label="Ordine (id separati da virgola, dal 1° al 6°)">
          <input value={race} onChange={(e) => setRace(e.target.value)} required style={input} placeholder="VER,HAM,NOR,LEC,SAI,ALO" />
        </Field>
      )}
      <button type="submit" disabled={busy} style={submitBtn}>
        {busy ? 'Salvo…' : 'Salva risultato'}
      </button>
    </form>
  );
}

function RoundPotForm({ onSubmit, busy }) {
  const [leagueId, setLeagueId] = useState('');
  const [round, setRound] = useState('');
  const [pool, setPool] = useState('');
  const [kickoff, setKickoff] = useState('');

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      leagueId: leagueId.trim(),
      round: Number(round),
      pool: Number(pool),
      kickoffAt: kickoff ? new Date(kickoff).toISOString() : null,
    });
  };

  return (
    <form onSubmit={submit} style={formGrid}>
      <Field label="League ID"><input value={leagueId} onChange={(e) => setLeagueId(e.target.value)} required style={input} /></Field>
      <Field label="Round"><input value={round} onChange={(e) => setRound(e.target.value)} type="number" required style={input} /></Field>
      <Field label="Monte premi (funnies)"><input value={pool} onChange={(e) => setPool(e.target.value)} type="number" required style={input} placeholder="100000" /></Field>
      <Field label="Kickoff prima partita (locale)"><input value={kickoff} onChange={(e) => setKickoff(e.target.value)} type="datetime-local" style={input} /></Field>
      <button type="submit" disabled={busy} style={submitBtn}>
        {busy ? 'Salvo…' : 'Imposta monte premi'}
      </button>
    </form>
  );
}

// Chiusura one-click: scegli il concorso (porta con sé base e quota del
// regolamento), indica la giornata, premi. La RPC admin_close_round fa
// risultati → punti → montepremi → payout in una sola transazione.
function CloseRoundForm({ onClose }) {
  const [contestKey, setContestKey] = useState(CONTESTS[0]?.key || '');
  const [round, setRound] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const contest = CONTESTS.find((c) => c.key === contestKey) || null;

  const run = async () => {
    if (!contest || !round) return;
    const ok = window.confirm(
      `Chiudere ${contest.league.label} — giornata ${round}?\n\n` +
      `Verranno calcolati i punti e distribuiti i Funnies ` +
      `(base ${contest.basePool} + iscritti × ${contest.perEntrant}). ` +
      `L'operazione si esegue UNA sola volta per giornata.`
    );
    if (!ok) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const out = await onClose({
        leagueId: contest.league.id,
        round,
        basePool: contest.basePool,
        perEntrant: contest.perEntrant,
      });
      setResult(out);
    } catch (e) {
      setError(e?.message || 'Errore durante la chiusura.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={formGrid}>
      <Field label="Concorso">
        <select value={contestKey} onChange={(e) => setContestKey(e.target.value)} style={input}>
          {CONTESTS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.league.label} (base {c.basePool} + n × {c.perEntrant})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Round / giornata">
        <input value={round} onChange={(e) => setRound(e.target.value)} type="number" style={input} />
      </Field>
      <button
        type="button"
        disabled={busy || !contest || !round}
        onClick={run}
        style={{ ...submitBtn, background: '#3DDC97' }}
      >
        {busy ? 'Chiusura in corso…' : 'Chiudi e paga la giornata'}
      </button>
      {error && <div style={{ color: '#FF5A6A', fontSize: 13 }}>{error}</div>}
      {result && (
        <div style={{ color: '#3DDC97', fontSize: 13, lineHeight: 1.6 }}>
          Giornata chiusa ✓ — {result.entrants} iscritti ·
          montepremi {Number(result.prize_pool).toLocaleString('it-IT')} ·
          {result.winners} vincitori ·
          {Number(result.total_paid).toLocaleString('it-IT')} Funnies pagati.
        </div>
      )}
    </div>
  );
}

function RoundSettleForm({ onSettle, onDistribute, busy }) {
  const [leagueId, setLeagueId] = useState('');
  const [round, setRound] = useState('');

  return (
    <div style={formGrid}>
      <Field label="League ID"><input value={leagueId} onChange={(e) => setLeagueId(e.target.value)} style={input} /></Field>
      <Field label="Round"><input value={round} onChange={(e) => setRound(e.target.value)} type="number" style={input} /></Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="button"
          disabled={busy || !leagueId || !round}
          onClick={() => onSettle({ leagueId, round })}
          style={submitBtn}
        >
          1. Calcola punti
        </button>
        <button
          type="button"
          disabled={busy || !leagueId || !round}
          onClick={() => onDistribute({ leagueId, round })}
          style={{ ...submitBtn, background: '#3DDC97' }}
        >
          2. Distribuisci monte premi
        </button>
      </div>
    </div>
  );
}

function LeadCampaignsAdmin({ list, upsert, toggle, remove, busy }) {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null = none, {} = new, {id,...} = edit
  const [err, setErr] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setErr(null);
      const rows = await list();
      setItems(rows);
    } catch (e) {
      setErr(e?.message || 'Errore nel caricamento campagne.');
    }
  }, [list]);

  useEffect(() => { refresh(); }, [refresh]);

  if (editing) {
    return (
      <CampaignForm
        initial={editing}
        busy={busy}
        onCancel={() => setEditing(null)}
        onSave={async (payload) => {
          await upsert(payload);
          setEditing(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div>
      {err && <div style={{ color: '#FF5A6A', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <button
        type="button"
        onClick={() => setEditing({
          id: null, brand: '', title: '', tagline: '', funnies_reward: 500,
          fields: [{ key: 'fullName', label: 'Nome e cognome', type: 'text', required: true }],
          disclaimer: '', data_sharing: '', active: true,
        })}
        style={{ ...submitBtn, gridColumn: 'unset', marginBottom: 12 }}
      >
        + Nuova campagna
      </button>
      {items.length === 0 && (
        <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Nessuna campagna.</div>
      )}
      {items.map((c) => (
        <div key={c.id} style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {c.brand} · {c.active ? 'attiva' : 'inattiva'} · {c.submissions_count} sub
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#F5F6FA' }}>
              {c.title}
            </div>
            <div style={{ fontSize: 12, color: '#FFDD2E', marginTop: 2 }}>+{c.funnies_reward} Funnies</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" style={smallBtn} onClick={() => setEditing(c)}>Modifica</button>
            <button type="button" style={smallBtn} onClick={async () => { await toggle(c.id, !c.active); await refresh(); }}>
              {c.active ? 'Disattiva' : 'Attiva'}
            </button>
            <button
              type="button"
              style={{ ...smallBtn, background: 'rgba(255,90,106,0.15)', color: '#FF5A6A' }}
              onClick={async () => {
                if (!confirm(`Eliminare "${c.title}"?`)) return;
                await remove(c.id);
                await refresh();
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CampaignForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const addField = () => setForm((f) => ({
    ...f, fields: [...(f.fields || []), { key: '', label: '', type: 'text', required: false }],
  }));
  const removeField = (i) => setForm((f) => ({
    ...f, fields: f.fields.filter((_, idx) => idx !== i),
  }));
  const updateField = (i, patch) => setForm((f) => ({
    ...f, fields: f.fields.map((fld, idx) => idx === i ? { ...fld, ...patch } : fld),
  }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      id: form.id,
      brand: form.brand.trim(),
      title: form.title.trim(),
      tagline: form.tagline?.trim() || null,
      funnies_reward: Number(form.funnies_reward),
      fields: form.fields.filter((f) => f.key && f.label),
      disclaimer: form.disclaimer,
      data_sharing: form.data_sharing,
      active: !!form.active,
    });
  };

  return (
    <form onSubmit={submit} style={formGrid}>
      <Field label="Brand"><input value={form.brand} onChange={set('brand')} required style={input} /></Field>
      <Field label="Reward (Funnies)"><input value={form.funnies_reward} onChange={set('funnies_reward')} type="number" required style={input} /></Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Titolo"><input value={form.title} onChange={set('title')} required style={input} /></Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Tagline"><input value={form.tagline || ''} onChange={set('tagline')} style={input} /></Field>
      </div>

      <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          Campi del form (chiesti all'utente)
        </div>
        {form.fields.map((fld, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px 70px auto', gap: 6, marginBottom: 6 }}>
            <input placeholder="key" value={fld.key} onChange={(e) => updateField(i, { key: e.target.value })} style={input} />
            <input placeholder="label mostrata" value={fld.label} onChange={(e) => updateField(i, { label: e.target.value })} style={input} />
            <select value={fld.type} onChange={(e) => updateField(i, { type: e.target.value })} style={input}>
              <option value="text">text</option>
              <option value="email">email</option>
              <option value="tel">tel</option>
              <option value="textarea">textarea</option>
              <option value="checkbox">checkbox</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'rgba(245,246,250,0.7)' }}>
              <input type="checkbox" checked={!!fld.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
              req
            </label>
            <button type="button" onClick={() => removeField(i)} style={{ ...smallBtn, background: 'rgba(255,90,106,0.15)', color: '#FF5A6A' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={addField} style={{ ...smallBtn, marginTop: 4 }}>+ Aggiungi campo</button>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Disclaimer (mostrato in checkbox finale)">
          <textarea value={form.disclaimer} onChange={set('disclaimer')} rows={3} style={{ ...input, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
        </Field>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Cosa verrà condiviso (mostrato in box info)">
          <textarea value={form.data_sharing} onChange={set('data_sharing')} rows={2} style={{ ...input, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
        </Field>
      </div>

      <label style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 8, color: '#F5F6FA', fontSize: 13 }}>
        <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
        Campagna attiva (visibile agli utenti)
      </label>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ ...submitBtn, gridColumn: 'unset', background: 'rgba(255,255,255,0.08)', color: '#F5F6FA', flex: 1 }}>Annulla</button>
        <button type="submit" disabled={busy} style={{ ...submitBtn, gridColumn: 'unset', flex: 2 }}>
          {busy ? 'Salvo…' : (form.id ? 'Aggiorna campagna' : 'Crea campagna')}
        </button>
      </div>
    </form>
  );
}

function FixturesAdmin({ list, upsert, rawUpsert, remove, busy }) {
  const leagueOptions = useMemo(() =>
    Object.entries(LEAGUES).map(([k, l]) => ({ key: k, id: l.id, label: `${l.label} (${l.id})` })),
  []);

  const [leagueId, setLeagueId] = useState(leagueOptions[0]?.id || '');
  const [round, setRound] = useState('');
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState(null);

  const refresh = useCallback(async () => {
    if (!leagueId) return;
    try {
      setErr(null);
      const data = await list({ leagueId, round: round ? Number(round) : null });
      setRows(data);
    } catch (e) {
      setErr(e?.message || 'Errore nel caricamento partite.');
    }
  }, [list, leagueId, round]);

  const importFromTheSportsDB = useCallback(async () => {
    if (!leagueId || !round) {
      setErr('Seleziona lega e inserisci un turno prima di importare.');
      return;
    }
    setErr(null);
    setImportMsg(null);
    setImporting(true);
    try {
      const events = await fetchTheSportsDBRound(leagueId, Number(round));
      if (!events || events.length === 0) {
        setImportMsg(`TheSportsDB non ha eventi per turno ${round}.`);
        return;
      }
      let ok = 0;
      const errors = [];
      for (const ev of events) {
        try {
          await rawUpsert({
            event_id:   String(ev.id),
            league_id:  String(leagueId),
            round:      ev.round != null ? Number(ev.round) : Number(round),
            home:       ev.home || '',
            away:       ev.away || '',
            kickoff_at: ev.dateISO,
            home_score: ev.homeScore,
            away_score: ev.awayScore,
            status:     ev.status || 'scheduled',
          });
          ok += 1;
        } catch (e) {
          errors.push(`${ev.home} vs ${ev.away}: ${e?.message || 'errore'}`);
        }
      }
      setImportMsg(
        `Importati ${ok}/${events.length} eventi${errors.length ? ' — ' + errors.slice(0, 2).join(' · ') : ''}.`
      );
      await refresh();
    } catch (e) {
      setErr(e?.message || 'Errore durante l\'import.');
    } finally {
      setImporting(false);
    }
  }, [leagueId, round, rawUpsert, refresh]);

  useEffect(() => { refresh(); }, [refresh]);

  if (editing) {
    return (
      <FixtureForm
        initial={editing}
        busy={busy}
        onCancel={() => setEditing(null)}
        onSave={async (payload) => {
          await upsert(payload);
          setEditing(null);
          await refresh();
        }}
      />
    );
  }

  return (
    <div>
      {err && <div style={{ color: '#FF5A6A', fontSize: 13, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px auto', gap: 8, marginBottom: 12 }}>
        <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)} style={input}>
          {leagueOptions.map((o) => (
            <option key={o.key} value={o.id}>{o.label}</option>
          ))}
        </select>
        <input placeholder="Round" value={round} onChange={(e) => setRound(e.target.value)} type="number" style={input} />
        <button type="button" style={smallBtn} onClick={refresh}>Ricarica</button>
      </div>

      {importMsg && (
        <div style={{ color: '#3DDC97', fontSize: 12, marginBottom: 8 }}>{importMsg}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            const now = new Date();
            now.setMinutes(0, 0, 0);
            now.setHours(now.getHours() + 24);
            const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            setEditing({
              event_id: `${leagueId}-${round || 'r'}-${Date.now()}`,
              league_id: leagueId, round: round ? Number(round) : '',
              home: '', away: '', kickoff_at: local,
              home_score: '', away_score: '', status: 'scheduled',
            });
          }}
          style={{ ...submitBtn, gridColumn: 'unset', flex: 1 }}
        >
          + Nuova partita
        </button>
        <button
          type="button"
          disabled={importing || !round}
          onClick={importFromTheSportsDB}
          style={{
            ...submitBtn, gridColumn: 'unset', flex: 1,
            background: importing ? 'rgba(255,255,255,0.08)' : '#3DDC97',
          }}
          title={round ? 'Scarica il turno da TheSportsDB e lo carica su Supabase' : 'Inserisci un Round per importare'}
        >
          {importing ? 'Importo…' : '↓ Importa turno da TheSportsDB'}
        </button>
      </div>

      {rows.length === 0 && (
        <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>
          Nessuna partita per questa lega{round ? ` al turno ${round}` : ''}.
        </div>
      )}

      {rows.map((r) => (
        <div key={r.event_id} style={rowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Turno {r.round ?? '—'} · {new Date(r.kickoff_at).toLocaleString('it-IT')} · {r.status}
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#F5F6FA' }}>
              {r.home} <span style={{ opacity: 0.5 }}>vs</span> {r.away}
            </div>
            {(r.home_score != null && r.away_score != null) && (
              <div style={{ fontSize: 12, color: '#FFDD2E', marginTop: 2 }}>
                Risultato {r.home_score} – {r.away_score}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button type="button" style={smallBtn} onClick={() => setEditing({
              ...r,
              kickoff_at: new Date(new Date(r.kickoff_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
            })}>Modifica</button>
            <button
              type="button"
              style={{ ...smallBtn, background: 'rgba(255,90,106,0.15)', color: '#FF5A6A' }}
              onClick={async () => {
                if (!confirm(`Eliminare ${r.home} vs ${r.away}?`)) return;
                await remove(r.event_id);
                await refresh();
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function FixtureForm({ initial, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      event_id: form.event_id.trim(),
      league_id: form.league_id.trim(),
      round: form.round === '' ? null : Number(form.round),
      home: form.home.trim(),
      away: form.away.trim(),
      kickoff_at: new Date(form.kickoff_at).toISOString(),
      home_score: form.home_score === '' ? null : Number(form.home_score),
      away_score: form.away_score === '' ? null : Number(form.away_score),
      status: form.status || 'scheduled',
    });
  };

  return (
    <form onSubmit={submit} style={formGrid}>
      <Field label="Event ID (univoco)">
        <input value={form.event_id} onChange={set('event_id')} required style={input} />
      </Field>
      <Field label="League ID">
        <input value={form.league_id} onChange={set('league_id')} required style={input} />
      </Field>
      <Field label="Round / giornata">
        <input value={form.round} onChange={set('round')} type="number" style={input} />
      </Field>
      <Field label="Status">
        <select value={form.status} onChange={set('status')} style={input}>
          <option value="scheduled">scheduled</option>
          <option value="live">live</option>
          <option value="finished">finished</option>
          <option value="postponed">postponed</option>
          <option value="cancelled">cancelled</option>
        </select>
      </Field>
      <Field label="Casa"><input value={form.home} onChange={set('home')} required style={input} /></Field>
      <Field label="Trasferta"><input value={form.away} onChange={set('away')} required style={input} /></Field>
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Kickoff (locale)">
          <input type="datetime-local" value={form.kickoff_at} onChange={set('kickoff_at')} required style={input} />
        </Field>
      </div>
      <Field label="Gol casa (opzionale)"><input type="number" value={form.home_score} onChange={set('home_score')} style={input} /></Field>
      <Field label="Gol trasferta (opzionale)"><input type="number" value={form.away_score} onChange={set('away_score')} style={input} /></Field>

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ ...submitBtn, gridColumn: 'unset', background: 'rgba(255,255,255,0.08)', color: '#F5F6FA', flex: 1 }}>Annulla</button>
        <button type="submit" disabled={busy} style={{ ...submitBtn, gridColumn: 'unset', flex: 2 }}>
          {busy ? 'Salvo…' : 'Salva partita'}
        </button>
      </div>
    </form>
  );
}

function BootstrapAdminForm({ bootstrap }) {
  const [secret, setSecret] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null); setErr(null); setBusy(true);
    try {
      await bootstrap(secret);
      setMsg('Accesso admin sbloccato. Ricarica la pagina.');
      setSecret('');
    } catch (e) {
      setErr(e?.message || 'Passphrase errata.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={formGrid}>
      <div style={{ gridColumn: '1 / -1', color: 'rgba(245,246,250,0.7)', fontSize: 13, lineHeight: 1.5 }}>
        Il tuo account è loggato ma non ha il flag admin. Inserisci qui la
        passphrase master definita nella funzione SQL <code>bootstrap_admin</code>
        — l'account corrente verrà promosso ad admin una volta sola.
      </div>
      {msg && (
        <div style={{ gridColumn: '1 / -1', color: '#3DDC97', fontSize: 13 }}>{msg}</div>
      )}
      {err && (
        <div style={{ gridColumn: '1 / -1', color: '#FF5A6A', fontSize: 13 }}>{err}</div>
      )}
      <div style={{ gridColumn: '1 / -1' }}>
        <Field label="Passphrase master">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoComplete="off"
            required
            style={input}
          />
        </Field>
      </div>
      <button type="submit" disabled={busy || !secret} style={submitBtn}>
        {busy ? 'Verifico…' : 'Sblocca admin'}
      </button>
    </form>
  );
}

const rowStyle = {
  display: 'flex', alignItems: 'center', gap: 12,
  background: '#111830', borderRadius: 14, padding: 12,
  border: '1px solid rgba(255,255,255,0.04)', marginBottom: 8,
};

const smallBtn = {
  background: 'rgba(255,255,255,0.08)', color: '#F5F6FA',
  border: 0, borderRadius: 8, padding: '6px 10px',
  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, cursor: 'pointer',
};

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const formGrid = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
  background: '#111830', borderRadius: 16, padding: 16,
  border: '1px solid rgba(255,255,255,0.04)',
};

const input = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 10, padding: '10px 12px',
  color: '#F5F6FA', fontFamily: 'Inter', fontSize: 13, outline: 'none',
};

const submitBtn = {
  gridColumn: '1 / -1',
  background: '#FFDD2E', color: '#0A0F1F',
  border: 0, borderRadius: 100, padding: '12px 16px',
  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, cursor: 'pointer',
};

const code = {
  background: 'rgba(0,0,0,0.3)',
  padding: 10, borderRadius: 8, fontSize: 12, marginTop: 8,
  whiteSpace: 'pre-wrap',
};
