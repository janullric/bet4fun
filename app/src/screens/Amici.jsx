import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CONTESTS } from '../lib/contests.js';
import { findLeagueById } from '../lib/sportsApi.js';

// Amici: richieste, lista, chat privata 1:1 e sfide 1v1 con posta in Funnies.
export default function Amici() {
  const navigate = useNavigate();
  const {
    isSupabaseConfigured, funnies,
    sendFriendRequest, respondFriendRequest, listFriends,
    sendDm, listDm, myUnreadDm,
    createDuel, respondDuel, listMyDuels,
  } = useApp();

  const [friends, setFriends] = useState([]);
  const [duels, setDuels] = useState([]);
  const [unread, setUnread] = useState({});
  const [nickInput, setNickInput] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [chatWith, setChatWith] = useState(null);   // { friend_id, nick }
  const [duelWith, setDuelWith] = useState(null);   // { nick }

  const refresh = useCallback(async () => {
    try { setFriends(await listFriends()); } catch { setFriends([]); }
    try { setDuels(await listMyDuels()); } catch { setDuels([]); }
    try {
      const u = await myUnreadDm();
      const map = {};
      (u || []).forEach((r) => { map[r.friend_id] = Number(r.unread); });
      setUnread(map);
    } catch { setUnread({}); }
  }, [listFriends, listMyDuels, myUnreadDm]);

  useEffect(() => { if (isSupabaseConfigured) refresh(); }, [isSupabaseConfigured, refresh]);

  const addFriend = async (e) => {
    e.preventDefault();
    setMsg(null); setErr(null);
    try {
      const out = await sendFriendRequest(nickInput.trim());
      setMsg(out === 'accepted' ? 'Siete amici! (vi eravate già cercati a vicenda)' : 'Richiesta inviata ✓');
      setNickInput('');
      await refresh();
    } catch (e2) {
      setErr(e2?.message || 'Errore.');
    }
  };

  const respond = async (id, ok) => {
    setErr(null);
    try { await respondFriendRequest(id, ok); await refresh(); }
    catch (e2) { setErr(e2?.message || 'Errore.'); }
  };

  const respondToDuel = async (id, ok) => {
    setErr(null);
    try { await respondDuel(id, ok); await refresh(); }
    catch (e2) { setErr(e2?.message || 'Errore.'); await refresh(); }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Amici" subtitle="Configura Supabase per usare gli amici.">
        <div style={{ padding: '0 22px' }} />
      </Screen>
    );
  }

  if (chatWith) {
    return (
      <ChatView
        friend={chatWith}
        onBack={() => { setChatWith(null); refresh(); }}
        listDm={listDm}
        sendDm={sendDm}
      />
    );
  }

  const accepted = friends.filter((f) => f.state === 'amico');
  const incoming = friends.filter((f) => f.state === 'ricevuta');
  const outgoing = friends.filter((f) => f.state === 'inviata');

  return (
    <Screen title="Amici" subtitle="Aggiungi, chatta, sfida." onBack={() => navigate('/home')}>
      <div style={{ padding: '0 22px 30px' }}>
        <form onSubmit={addFriend} style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={nickInput}
            onChange={(e) => setNickInput(e.target.value)}
            placeholder="Nickname dell'amico…"
            style={inputStyle}
          />
          <button type="submit" disabled={!nickInput.trim()} style={btnYellow}>Aggiungi</button>
        </form>
        {msg && <div style={{ color: '#3DDC97', fontSize: 13, marginBottom: 10 }}>{msg}</div>}
        {err && <div style={{ color: '#FF5A6A', fontSize: 13, marginBottom: 10 }}>{err}</div>}

        {incoming.length > 0 && (
          <>
            <SectionLabel>Richieste ricevute</SectionLabel>
            {incoming.map((f) => (
              <Row key={f.friendship_id}>
                <span style={{ flex: 1, fontWeight: 600 }}>{f.nick}</span>
                <button onClick={() => respond(f.friendship_id, true)} style={btnSmall('#3DDC97')}>Accetta</button>
                <button onClick={() => respond(f.friendship_id, false)} style={btnSmall('#FF5A6A')}>Rifiuta</button>
              </Row>
            ))}
          </>
        )}

        <SectionLabel>I tuoi amici ({accepted.length})</SectionLabel>
        {accepted.length === 0 && (
          <div style={{ color: 'rgba(245,246,250,0.55)', fontSize: 13, marginBottom: 10 }}>
            Nessun amico ancora: aggiungine uno col suo nickname.
          </div>
        )}
        {accepted.map((f) => (
          <Row key={f.friendship_id}>
            <span style={{ flex: 1, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {f.nick}
              {unread[f.friend_id] > 0 && (
                <span style={{ marginLeft: 8, background: '#FF5A6A', color: '#fff', borderRadius: 100, fontSize: 10, padding: '2px 7px', fontWeight: 700 }}>
                  {unread[f.friend_id]}
                </span>
              )}
            </span>
            <button onClick={() => setChatWith(f)} style={btnSmall('#4C7DFF')}>💬 Chat</button>
            <button onClick={() => setDuelWith(duelWith?.nick === f.nick ? null : f)} style={btnSmall('#FFDD2E')}>⚔️ Sfida</button>
          </Row>
        ))}

        {duelWith && (
          <DuelForm
            nick={duelWith.nick}
            funnies={funnies}
            onCancel={() => setDuelWith(null)}
            onCreate={async (payload) => {
              await createDuel(payload);
              setDuelWith(null);
              setMsg(`Sfida inviata a ${payload.nick} ⚔️`);
              await refresh();
            }}
          />
        )}

        {outgoing.length > 0 && (
          <>
            <SectionLabel>Richieste inviate</SectionLabel>
            {outgoing.map((f) => (
              <Row key={f.friendship_id}>
                <span style={{ flex: 1 }}>{f.nick}</span>
                <span style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono' }}>in attesa…</span>
              </Row>
            ))}
          </>
        )}

        {duels.length > 0 && (
          <>
            <SectionLabel>Sfide 1v1</SectionLabel>
            {duels.map((d) => {
              const league = findLeagueById(d.league_id);
              return (
                <div key={d.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>
                      ⚔️ vs {d.rival}
                      <span style={{ color: 'rgba(245,246,250,0.5)', fontWeight: 500, marginLeft: 6, fontSize: 12 }}>
                        {league?.label || d.league_id} · G{d.round}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFDD2E', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}>
                      <Funnie size={11} /> {d.stake} a testa
                    </span>
                  </div>
                  {d.status === 'pending' && !d.im_challenger && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => respondToDuel(d.id, true)} style={btnSmall('#3DDC97')}>Accetto la sfida</button>
                      <button onClick={() => respondToDuel(d.id, false)} style={btnSmall('#FF5A6A')}>Rifiuto</button>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.55)', fontFamily: 'JetBrains Mono' }}>
                    {d.status === 'pending' && d.im_challenger && 'In attesa di risposta…'}
                    {d.status === 'accepted' && `Accettata: in palio ${d.stake * 2} Funnies. Si decide a fine giornata.`}
                    {d.status === 'declined' && 'Rifiutata.'}
                    {d.status === 'void' && 'Annullata.'}
                    {d.status === 'settled' && (
                      d.i_won == null || (d.my_points === d.rival_points)
                        ? `Pareggio ${d.my_points}–${d.rival_points}: posta rimborsata.`
                        : d.i_won
                          ? `Hai VINTO ${d.my_points}–${d.rival_points}! +${d.stake * 2} Funnies 🏆`
                          : `Hai perso ${d.my_points}–${d.rival_points}. Sarà per la prossima…`
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </Screen>
  );
}

function ChatView({ friend, onBack, listDm, sendDm }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const load = useCallback(async () => {
    try { setMessages(await listDm(friend.friend_id)); } catch { /* noop */ }
  }, [listDm, friend.friend_id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // polling leggero
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendDm(friend.friend_id, body);
      setDraft('');
      await load();
    } catch { /* il testo resta nel campo */ } finally {
      setSending(false);
    }
  };

  return (
    <Screen title={friend.nick} subtitle="Chat privata" onBack={onBack}>
      <div style={{ padding: '0 22px 16px', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 200 }}>
        {messages.length === 0 && (
          <div style={{ color: 'rgba(245,246,250,0.5)', fontSize: 13 }}>
            Nessun messaggio: rompi il ghiaccio!
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.mine ? 'flex-end' : 'flex-start',
              maxWidth: '78%',
              background: m.mine ? '#FFDD2E' : '#1A2240',
              color: m.mine ? '#0A0F1F' : '#F5F6FA',
              borderRadius: m.mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '9px 12px',
              fontSize: 14,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {m.body}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div style={{ padding: '0 22px 30px', display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          maxLength={500}
          placeholder="Scrivi un messaggio…"
          style={inputStyle}
        />
        <button onClick={send} disabled={sending || !draft.trim()} style={btnYellow}>Invia</button>
      </div>
    </Screen>
  );
}

function DuelForm({ nick, funnies, onCancel, onCreate }) {
  const [contestKey, setContestKey] = useState('worldcup');
  const [round, setRound] = useState('');
  const [stake, setStake] = useState('100');
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const contest = CONTESTS.find((c) => c.key === contestKey);

  const submit = async () => {
    setErr(null); setBusy(true);
    try {
      await onCreate({ nick, leagueId: contest.league.id, round: Number(round), stake: Number(stake) });
    } catch (e) {
      setErr(e?.message || 'Errore.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 8, border: '1px solid rgba(255,221,46,0.3)' }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>⚔️ Sfida {nick}: chi fa più punti vince la posta</div>
      <select value={contestKey} onChange={(e) => setContestKey(e.target.value)} style={inputStyle}>
        {CONTESTS.map((c) => <option key={c.key} value={c.key}>{c.league.label}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="number" value={round} onChange={(e) => setRound(e.target.value)} placeholder="Giornata (es. 1)" style={{ ...inputStyle, flex: 1 }} />
        <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} placeholder="Posta" min={10} style={{ ...inputStyle, flex: 1 }} />
      </div>
      <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)' }}>
        Hai {Number(funnies).toLocaleString('it-IT')} Funnies. La posta viene scalata a entrambi quando l'amico accetta; pareggio = rimborso.
      </div>
      {err && <div style={{ color: '#FF5A6A', fontSize: 12 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={submit} disabled={busy || !round || !stake} style={btnYellow}>{busy ? 'Invio…' : 'Lancia la sfida'}</button>
        <button onClick={onCancel} style={btnSmall('rgba(245,246,250,0.6)')}>Annulla</button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ margin: '16px 0 8px', color: 'rgba(245,246,250,0.6)', fontSize: 12, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>
      {children}
    </div>
  );
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#111830',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: 14,
  padding: 12,
  marginBottom: 8,
  color: '#F5F6FA',
  fontFamily: 'Inter',
  fontSize: 14,
};

function Row({ children }) {
  return <div style={rowStyle}>{children}</div>;
}

const inputStyle = {
  flex: 1,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '11px 13px',
  color: '#F5F6FA',
  fontFamily: 'Inter',
  fontSize: 14,
  outline: 'none',
};

const btnYellow = {
  background: '#FFDD2E',
  color: '#0A0F1F',
  border: 0,
  borderRadius: 12,
  padding: '11px 16px',
  fontFamily: 'Space Grotesk',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

function btnSmall(color) {
  return {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${color}`,
    color,
    borderRadius: 10,
    padding: '7px 12px',
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
  };
}
