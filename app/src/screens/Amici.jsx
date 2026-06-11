import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Funnie from '../components/Funnie.jsx';
import Icon from '../components/Icon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { supabase } from '../lib/supabase.js';
import { CONTESTS } from '../lib/contests.js';
import { findLeagueById } from '../lib/sportsApi.js';
import { formatLastSeen } from '../lib/format.js';

// Pallino verde (online) o ultima connessione.
function PresenceDot({ online }) {
  return (
    <span
      title={online ? 'Online' : 'Offline'}
      style={{
        width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
        background: online ? '#3DDC97' : 'rgba(245,246,250,0.25)',
        boxShadow: online ? '0 0 6px #3DDC97' : 'none',
      }}
    />
  );
}

// Amici: richieste, lista, chat privata 1:1 e sfide 1v1 con posta in Funnies.
export default function Amici() {
  const navigate = useNavigate();
  const {
    isSupabaseConfigured, funnies, session,
    sendFriendRequest, respondFriendRequest, listFriends,
    sendDm, listDm, myUnreadDm,
    createDuel, respondDuel, listMyDuels,
    isUserOnline,
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

  // Apertura diretta da un'altra schermata (es. profilo amico → Messaggio/Sfida).
  // Consumo lo stato di navigazione una sola volta, e lo ripulisco dalla history
  // senza navigare (così non causo re-render né riaperture col tasto indietro).
  const location = useLocation();
  const navConsumed = useRef(false);
  useEffect(() => {
    if (navConsumed.current) return;
    const st = location.state;
    if (st?.openChat) { setChatWith(st.openChat); navConsumed.current = true; }
    else if (st?.openDuel) { setDuelWith(st.openDuel); navConsumed.current = true; }
    if (navConsumed.current && typeof window !== 'undefined') {
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
        myId={session?.user?.id}
        online={isUserOnline ? isUserOnline(chatWith.friend_id) : false}
        onBack={() => { setChatWith(null); refresh(); }}
        listDm={listDm}
        sendDm={sendDm}
      />
    );
  }

  const accepted = friends.filter((f) => f.state === 'amico');
  const incoming = friends.filter((f) => f.state === 'ricevuta');
  const outgoing = friends.filter((f) => f.state === 'inviata');
  // Sfide ricevute ancora da accettare (azione richiesta).
  const pendingDuels = duels.filter((d) => d.status === 'pending' && !d.im_challenger);

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
          <div
            style={{
              background: 'rgba(255,221,46,0.10)',
              border: '1px solid rgba(255,221,46,0.4)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 18,
              boxShadow: '0 0 0 4px rgba(255,221,46,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                className="b4f-pulse"
                style={{
                  minWidth: 24, height: 24, padding: '0 7px', borderRadius: 12,
                  background: '#FF5A6A', color: '#fff', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {incoming.length}
              </span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#FFDD2E' }}>
                {incoming.length === 1 ? 'Nuova richiesta di amicizia!' : 'Nuove richieste di amicizia!'}
              </span>
            </div>
            {incoming.map((f) => (
              <div
                key={f.friendship_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                  padding: '12px 14px', marginBottom: 8,
                }}
              >
                <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{f.nick}</span>
                <button onClick={() => respond(f.friendship_id, true)} style={btnSolid('#3DDC97')}>Accetta</button>
                <button onClick={() => respond(f.friendship_id, false)} style={btnSmall('#FF5A6A')}>Rifiuta</button>
              </div>
            ))}
          </div>
        )}

        {/* Sfide da accettare — banner vistoso in cima */}
        {pendingDuels.length > 0 && (
          <div
            style={{
              background: 'rgba(255,90,106,0.10)',
              border: '1px solid rgba(255,90,106,0.45)',
              borderRadius: 16,
              padding: 14,
              marginBottom: 18,
              boxShadow: '0 0 0 4px rgba(255,90,106,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span
                className="b4f-pulse"
                style={{
                  minWidth: 24, height: 24, padding: '0 7px', borderRadius: 12,
                  background: '#FF5A6A', color: '#fff', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {pendingDuels.length}
              </span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: '#FF8A95' }}>
                {pendingDuels.length === 1 ? 'Sfida ricevuta!' : 'Sfide ricevute!'}
              </span>
            </div>
            {pendingDuels.map((d) => {
              const league = findLeagueById(d.league_id);
              return (
                <div
                  key={d.id}
                  style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 12,
                    padding: '12px 14px', marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      ⚔️ {d.rival} ti sfida
                      <span style={{ color: 'rgba(245,246,250,0.55)', fontWeight: 500, marginLeft: 6, fontSize: 12 }}>
                        {league?.label || d.league_id} · G{d.round}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#FFDD2E', fontFamily: 'JetBrains Mono', fontSize: 12, fontWeight: 700 }}>
                      <Funnie size={11} /> {d.stake} a testa
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => respondToDuel(d.id, true)} style={btnSolid('#3DDC97')}>Accetto la sfida</button>
                    <button onClick={() => respondToDuel(d.id, false)} style={btnSmall('#FF5A6A')}>Rifiuto</button>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', marginTop: 8 }}>
                    Accettando, a entrambi vengono messi da parte {d.stake} Funnies. Chi fa più punti in quella giornata vince {d.stake * 2}.
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SectionLabel>I tuoi amici ({accepted.length})</SectionLabel>
        {accepted.length === 0 && (
          <div style={{ color: 'rgba(245,246,250,0.55)', fontSize: 13, marginBottom: 10 }}>
            Nessun amico ancora: aggiungine uno col suo nickname.
          </div>
        )}
        {accepted.map((f) => {
          const online = isUserOnline ? isUserOnline(f.friend_id) : false;
          return (
            <Row key={f.friendship_id}>
              <PresenceDot online={online} />
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nick}</span>
                  {unread[f.friend_id] > 0 && (
                    <span style={{ background: '#FF5A6A', color: '#fff', borderRadius: 100, fontSize: 10, padding: '2px 7px', fontWeight: 700, flexShrink: 0 }}>
                      {unread[f.friend_id]}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: online ? '#3DDC97' : 'rgba(245,246,250,0.45)', fontFamily: 'JetBrains Mono' }}>
                  {online ? 'online' : `ultima connessione ${formatLastSeen(f.last_seen)}`}
                </span>
              </span>
              <button onClick={() => setChatWith(f)} style={btnSmall('#4C7DFF')}>💬 Chat</button>
              <button onClick={() => setDuelWith(duelWith?.nick === f.nick ? null : f)} style={btnSmall('#FFDD2E')}>⚔️ Sfida</button>
            </Row>
          );
        })}

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

        {/* Storico/stato sfide: escludo quelle da accettare (sono nel banner). */}
        {duels.filter((d) => !(d.status === 'pending' && !d.im_challenger)).length > 0 && (
          <>
            <SectionLabel>Sfide 1v1</SectionLabel>
            {duels.filter((d) => !(d.status === 'pending' && !d.im_challenger)).map((d) => {
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

function ChatView({ friend, myId, online, onBack, listDm, sendDm }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [theyTyping, setTheyTyping] = useState(false);
  const endRef = useRef(null);
  const chanRef = useRef(null);
  const typingTimer = useRef(null);
  const lastSent = useRef(0);

  const load = useCallback(async () => {
    try { setMessages(await listDm(friend.friend_id)); } catch { /* noop */ }
  }, [listDm, friend.friend_id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000); // polling leggero per i nuovi messaggi
    return () => clearInterval(t);
  }, [load]);

  // Canale Realtime per conversazione: broadcast "sta scrivendo" + ping
  // per ricaricare i messaggi appena l'altro invia (consegna quasi istantanea).
  useEffect(() => {
    if (!supabase || !myId || !friend.friend_id) return undefined;
    const room = `dm:${[myId, friend.friend_id].sort().join(':')}`;
    const ch = supabase.channel(room, { config: { broadcast: { self: false } } });
    ch.on('broadcast', { event: 'typing' }, ({ payload }) => {
      if (payload?.from === friend.friend_id) {
        setTheyTyping(true);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTheyTyping(false), 2500);
      }
    });
    ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
      if (payload?.from === friend.friend_id) { setTheyTyping(false); load(); }
    });
    ch.subscribe();
    chanRef.current = ch;
    return () => { clearTimeout(typingTimer.current); supabase.removeChannel(ch); chanRef.current = null; };
  }, [myId, friend.friend_id, load]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, theyTyping]);

  // Notifica "sto scrivendo" all'altro (max 1 broadcast/secondo).
  const onType = (val) => {
    setDraft(val);
    const now = Date.now();
    if (chanRef.current && now - lastSent.current > 1000) {
      lastSent.current = now;
      chanRef.current.send({ type: 'broadcast', event: 'typing', payload: { from: myId } });
    }
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await sendDm(friend.friend_id, body);
      setDraft('');
      // Avvisa l'altro di ricaricare subito (consegna quasi istantanea).
      chanRef.current?.send({ type: 'broadcast', event: 'msg', payload: { from: myId } });
      await load();
    } catch { /* il testo resta nel campo */ } finally {
      setSending(false);
    }
  };

  const statusText = theyTyping ? 'sta scrivendo…' : online ? 'online' : 'offline';
  const statusColor = theyTyping || online ? '#3DDC97' : 'rgba(245,246,250,0.5)';
  const initial = (friend.nick?.[0] || '?').toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', color: '#F5F6FA', fontFamily: 'Inter' }}>
      {/* Header chat: indietro + avatar + nome + stato */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: '#0A0F1F', zIndex: 5 }}>
        <button onClick={onBack} aria-label="Indietro" style={{ background: 'rgba(255,255,255,0.06)', border: 0, color: '#F5F6FA', width: 36, height: 36, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="chevL" size={18} />
        </button>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #4C7DFF 0%, #1a2240 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 18 }}>
            {initial}
          </div>
          {online && <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#3DDC97', border: '2px solid #0A0F1F', boxShadow: '0 0 6px #3DDC97' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>{friend.nick}</div>
          <div style={{ fontSize: 12, color: statusColor, fontWeight: 600 }}>{statusText}</div>
        </div>
      </div>

      {/* Area messaggi */}
      <div style={{ flex: 1, padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 3, background: 'radial-gradient(120% 50% at 50% 0%, rgba(26,34,64,0.35) 0%, transparent 60%)' }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(245,246,250,0.45)', fontSize: 14, padding: 30 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>👋</div>
            Nessun messaggio ancora.<br />Rompi il ghiaccio con {friend.nick}!
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showDivider = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
          // Raggruppa i messaggi consecutivi dello stesso mittente (coda solo sull'ultimo).
          const next = messages[i + 1];
          const isLastOfGroup = !next || next.mine !== m.mine || dayKey(next.created_at) !== dayKey(m.created_at);
          return (
            <div key={m.id}>
              {showDivider && (
                <div style={{ textAlign: 'center', margin: '14px 0 10px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(245,246,250,0.55)', fontSize: 11, fontFamily: 'JetBrains Mono', padding: '4px 12px', borderRadius: 100 }}>
                    {dayLabel(m.created_at)}
                  </span>
                </div>
              )}
              <div
                className="b4f-msg-in"
                style={{
                  alignSelf: m.mine ? 'flex-end' : 'flex-start',
                  marginLeft: m.mine ? 'auto' : 0,
                  marginRight: m.mine ? 0 : 'auto',
                  maxWidth: '76%',
                  marginBottom: isLastOfGroup ? 8 : 2,
                  background: m.mine ? 'linear-gradient(135deg, #FFE45C 0%, #FFDD2E 100%)' : '#1A2240',
                  color: m.mine ? '#1A0F00' : '#F5F6FA',
                  borderRadius: m.mine
                    ? `16px 16px ${isLastOfGroup ? '4px' : '16px'} 16px`
                    : `16px 16px 16px ${isLastOfGroup ? '4px' : '16px'}`,
                  padding: '9px 13px 7px',
                  fontSize: 14.5,
                  lineHeight: 1.4,
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                }}
              >
                <span>{m.body}</span>
                <span style={{ fontSize: 10, marginLeft: 8, opacity: 0.55, fontFamily: 'JetBrains Mono', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
                  {hhmm(m.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        {theyTyping && (
          <div style={{ alignSelf: 'flex-start', marginRight: 'auto', background: '#1A2240', borderRadius: '16px 16px 16px 4px', padding: '12px 16px', marginTop: 4, display: 'inline-flex', gap: 4, alignItems: 'center' }}>
            {[0, 1, 2].map((n) => (
              <span key={n} className="b4f-typing-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(245,246,250,0.7)', animationDelay: `${n * 0.18}s` }} />
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Barra di scrittura */}
      <div style={{ padding: '10px 18px 26px', position: 'sticky', bottom: 0, background: '#0A0F1F', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100, padding: '6px 6px 6px 16px' }}>
          <input
            value={draft}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            maxLength={500}
            placeholder="Scrivi un messaggio…"
            style={{ flex: 1, background: 'transparent', border: 0, color: '#F5F6FA', fontFamily: 'Inter', fontSize: 15, outline: 'none' }}
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            aria-label="Invia"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 0, flexShrink: 0,
              background: draft.trim() ? '#FFDD2E' : 'rgba(255,255,255,0.1)',
              color: draft.trim() ? '#0A0F1F' : 'rgba(245,246,250,0.4)',
              cursor: draft.trim() ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper data/ora per la chat.
function hhmm(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
function dayKey(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function dayLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const key = dayKey(iso);
  if (key === dayKey(now.toISOString())) return 'Oggi';
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (key === dayKey(y.toISOString())) return 'Ieri';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long' });
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

// Bottone pieno (più evidente) per l'azione principale "Accetta".
function btnSolid(bg) {
  return {
    background: bg,
    border: 0,
    color: '#0A0F1F',
    borderRadius: 10,
    padding: '8px 16px',
    fontFamily: 'Space Grotesk',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
  };
}
