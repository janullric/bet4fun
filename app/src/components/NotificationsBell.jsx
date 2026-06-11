import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CONTESTS } from '../lib/contests.js';
import { formatCountdown } from '../lib/format.js';

// Campanella notifiche globale: visibile nell'header di OGNI pagina.
// Si carica da sola i dati leggeri: schedine aperte da gestire, richieste
// di amicizia ricevute, messaggi privati non letti, ultime giocate.
export default function NotificationsBell() {
  const navigate = useNavigate();
  const {
    isSupabaseConfigured, isAuthed,
    listMyBets, listFriends, myUnreadDm, listMyDuels,
  } = useApp();

  const [open, setOpen] = useState(false);
  const [bets, setBets] = useState([]);
  const [friendReqs, setFriendReqs] = useState([]);
  const [duelReqs, setDuelReqs] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const ref = useRef(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !isAuthed) return;
    try { setBets(await listMyBets()); } catch { /* noop */ }
    try {
      const fr = await listFriends();
      setFriendReqs((fr || []).filter((f) => f.state === 'ricevuta'));
    } catch { /* noop */ }
    try {
      const d = await listMyDuels();
      setDuelReqs((d || []).filter((x) => x.status === 'pending' && !x.im_challenger));
    } catch { /* noop */ }
    try {
      const u = await myUnreadDm();
      setUnreadTotal((u || []).reduce((s, r) => s + Number(r.unread || 0), 0));
    } catch { /* noop */ }
  }, [isSupabaseConfigured, isAuthed, listMyBets, listFriends, myUnreadDm, listMyDuels]);

  // Carico al mount e ogni volta che apro il pannello (dati freschi).
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!open) return;
    load();
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!isSupabaseConfigured || !isAuthed) return null;

  const openBets = bets.filter((b) => b.editable);
  const recent = bets.slice(0, 3);
  const hasNotifications =
    friendReqs.length > 0 || duelReqs.length > 0 || unreadTotal > 0 || openBets.length > 0 || bets.length > 0;

  const go = (path) => { setOpen(false); navigate(path); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        aria-label="Notifiche"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA',
          width: 40, height: 40, borderRadius: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        }}
      >
        <Icon name="bell" size={20} />
        {hasNotifications && (
          <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#FF5A6A' }} />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 48, right: 0, width: 290,
            background: '#111830', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, boxShadow: '0 18px 40px rgba(0,0,0,0.4)',
            padding: 12, zIndex: 50, fontFamily: 'Inter',
            maxHeight: '70vh', overflowY: 'auto',
          }}
        >
          <div style={labelStyle}>Notifiche</div>

          {friendReqs.length > 0 && (
            <button onClick={() => go('/amici')} style={card('rgba(76,125,255,0.10)', 'rgba(76,125,255,0.3)')}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {friendReqs.length} richiesta{friendReqs.length > 1 ? 'e' : ''} di amicizia
              </div>
              <div style={subStyle}>{friendReqs.map((f) => f.nick).join(', ')} · Rispondi →</div>
            </button>
          )}

          {duelReqs.length > 0 && (
            <button onClick={() => go('/amici')} style={card('rgba(255,90,106,0.10)', 'rgba(255,90,106,0.35)')}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                ⚔️ {duelReqs.length} sfida{duelReqs.length > 1 ? 'e' : ''} da accettare
              </div>
              <div style={subStyle}>{duelReqs.map((d) => `${d.rival} (${d.stake})`).join(', ')} · Rispondi →</div>
            </button>
          )}

          {unreadTotal > 0 && (
            <button onClick={() => go('/amici')} style={card('rgba(255,221,46,0.10)', 'rgba(255,221,46,0.3)')}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {unreadTotal} messaggio{unreadTotal > 1 ? 'i' : ''} non letto{unreadTotal > 1 ? 'i' : ''}
              </div>
              <div style={subStyle}>Apri le chat con i tuoi amici →</div>
            </button>
          )}

          {openBets.length > 0 && (
            <button onClick={() => go('/schedine')} style={card('rgba(34,197,94,0.10)', 'rgba(34,197,94,0.25)')}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{openBets.length} schedine aperte</div>
              <div style={subStyle}>Puoi ancora modificarle prima del kickoff · Gestisci →</div>
            </button>
          )}

          {recent.length > 0 && <div style={{ ...labelStyle, fontSize: 10 }}>Ultime giocate</div>}
          {recent.map((b) => {
            const c = CONTESTS.find((x) => String(x.league.id) === String(b.league_id));
            const leagueLabel = c?.league.label || b.league_id;
            const countdown = b.editable && b.first_kickoff_at ? formatCountdown(b.first_kickoff_at) : null;
            return (
              <button key={b.bet_id} onClick={() => go('/schedine')}
                style={{ width: '100%', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: 0,
                  color: '#F5F6FA', borderRadius: 10, padding: '8px 10px', marginBottom: 6, cursor: 'pointer',
                  fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: b.editable ? '#22c55e' : 'rgba(255,90,106,0.8)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leagueLabel}</div>
                  <div style={{ fontSize: 10, color: 'rgba(245,246,250,0.55)' }}>
                    {b.settled ? 'Conclusa' : b.editable ? (countdown ? `Inizia tra ${countdown}` : 'Aperta') : 'In corso'}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: b.editable ? '#22c55e' : '#FF5A6A' }}>+{b.funnies_awarded}</span>
              </button>
            );
          })}

          {!hasNotifications && (
            <div style={{ padding: '10px 4px', color: 'rgba(245,246,250,0.55)', fontSize: 12 }}>
              Nessuna notifica per ora. Gioca una schedina per iniziare.
            </div>
          )}

          <button onClick={() => go('/schedine')}
            style={{ marginTop: 8, width: '100%', background: '#FFDD2E', color: '#0A0F1F', border: 0,
              borderRadius: 10, padding: '9px 12px', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Apri tutte le schedine
          </button>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.5)',
  textTransform: 'uppercase', letterSpacing: 1, padding: '2px 4px 8px',
};
const subStyle = { fontSize: 11, color: 'rgba(245,246,250,0.65)', marginTop: 2 };
function card(bg, border) {
  return {
    width: '100%', textAlign: 'left', background: bg, border: `1px solid ${border}`,
    color: '#F5F6FA', borderRadius: 12, padding: '10px 12px', marginBottom: 8, cursor: 'pointer', fontFamily: 'Inter',
  };
}
