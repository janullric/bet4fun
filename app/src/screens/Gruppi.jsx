import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';
import { findLeagueById } from '../lib/sportsApi.js';
import { formatMatchDate } from '../lib/format.js';
import { CONTESTS } from '../lib/contests.js';

// Schermata gruppi: lista dei miei gruppi + creazione + join via codice +
// drill-down alla classifica interna. Tutta la logica è nei wrapper RPC;
// qui gestiamo solo state locale e UX.
export default function Gruppi() {
  const {
    isSupabaseConfigured,
    listMyGroups,
    createGroup,
    joinGroupByCode,
    groupLeaderboard,
    leaveGroup,
    groupRoundBets,
    groupLeagueStandings,
    setGroupStake,
    addBetComment,
    listGroupComments,
  } = useApp();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'join' | { detail: group }
  const [leaderboard, setLeaderboard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);
  const [groupBets, setGroupBets] = useState(null);
  const [standings, setStandings] = useState(null);
  const [boardTab, setBoardTab] = useState('generale'); // 'generale' | leagueId
  const [comments, setComments] = useState([]);
  const [stake, setStake] = useState(null); // { title, leagueId }

  const reloadComments = async (groupId) => {
    try {
      setComments(await listGroupComments(groupId));
    } catch {
      setComments([]);
    }
  };

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setGroups(await listMyGroups());
    } catch (e) {
      setError(e?.message || 'Errore nel caricare i gruppi.');
    } finally {
      setLoading(false);
    }
  }, [listMyGroups]);

  useEffect(() => { refresh(); }, [refresh]);

  const openDetail = async (group) => {
    setMode({ detail: group });
    setBoardLoading(true);
    setLeaderboard(null);
    setGroupBets(null);
    setStandings(null);
    setBoardTab('generale');
    try {
      const rows = await groupLeaderboard(group.id);
      setLeaderboard(rows);
    } catch (e) {
      setLeaderboard([]);
      setError(e?.message || 'Errore nel caricare la classifica.');
    } finally {
      setBoardLoading(false);
    }
    // Schedine dei membri + classifiche per competizione: caricamenti
    // separati, se falliscono mostriamo comunque la classifica generale.
    try {
      setGroupBets(await groupRoundBets(group.id));
    } catch {
      setGroupBets([]);
    }
    try {
      setStandings(await groupLeagueStandings(group.id));
    } catch {
      setStandings([]);
    }
    setStake({ title: group.stake_title || '', leagueId: group.stake_league_id || '' });
    await reloadComments(group.id);
  };

  const handleLeave = async (group) => {
    if (!confirm(`Uscire dal gruppo "${group.name}"?`)) return;
    try {
      await leaveGroup(group.id);
      setMode(null);
      await refresh();
    } catch (e) {
      setError(e?.message || 'Errore durante l\'uscita.');
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Gruppi" subtitle="Sfida gli amici in gruppi privati.">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>
          Configura Supabase per usare i gruppi (vedi <code>SUPABASE_SETUP.md</code>).
        </div>
      </Screen>
    );
  }

  if (mode?.detail) {
    const g = mode.detail;
    return (
      <Screen
        title={g.name}
        subtitle={g.description || `Codice invito: ${g.invite_code}`}
        onBack={() => { setMode(null); setLeaderboard(null); }}
      >
        <div style={{ padding: '0 22px 16px' }}>
          <InviteCard code={g.invite_code} />

          <GroupStakeCard
            stake={stake}
            isOwner={g.is_owner}
            onSave={async (next) => {
              await setGroupStake({ groupId: g.id, title: next.title, leagueId: next.leagueId });
              setStake(next);
              await refresh();
            }}
          />
          <div style={{ marginTop: 18, marginBottom: 10, color: 'rgba(245,246,250,0.6)', fontSize: 12, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>
            Classifica interna
          </div>

          {/* Chip: Generale (Funnies) + una per competizione giocata. */}
          {standings && standings.length > 0 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 12 }}>
              {['generale', ...new Set(standings.map((s) => s.league_id))].map((lid) => {
                const sel = boardTab === lid;
                const label = lid === 'generale'
                  ? 'Generale'
                  : (findLeagueById(lid)?.label || lid);
                return (
                  <button
                    key={lid}
                    onClick={() => setBoardTab(lid)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 100,
                      border: 0,
                      cursor: 'pointer',
                      background: sel ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
                      color: sel ? '#0A0F1F' : 'rgba(245,246,250,0.75)',
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      fontFamily: 'Inter',
                      flexShrink: 0,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {boardLoading && <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico…</div>}

          {boardTab === 'generale' && !boardLoading && leaderboard && leaderboard.length === 0 && (
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Ancora nessun membro. Condividi il codice!</div>
          )}
          {boardTab === 'generale' && !boardLoading && leaderboard && leaderboard.map((row, i) => (
            <GroupLeaderRow key={i} rank={i + 1} {...row} />
          ))}

          {boardTab !== 'generale' && standings && (
            <>
              {standings
                .filter((s) => s.league_id === boardTab)
                .map((s, i) => (
                  <StandingRow key={i} rank={i + 1} {...s} />
                ))}
              <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.45)', marginTop: 8, lineHeight: 1.5 }}>
                I punti arrivano dal calcolo ufficiale a fine giornata; le
                schedine contano da subito.
              </div>
            </>
          )}

          <div style={{ marginTop: 22, marginBottom: 10, color: 'rgba(245,246,250,0.6)', fontSize: 12, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>
            Schedine del gruppo
          </div>
          <div style={{ fontSize: 12, color: 'rgba(245,246,250,0.45)', marginBottom: 10, lineHeight: 1.5 }}>
            I pronostici dei membri compaiono qui quando la giornata inizia:
            prima del kickoff nessuno può sbirciare. 😉
          </div>
          {groupBets == null && <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico…</div>}
          {groupBets && groupBets.length === 0 && (
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>
              Ancora nessuna schedina visibile: aspetta l'inizio della prossima giornata.
            </div>
          )}
          {groupBets && groupBets.map((b, i) => (
            <GroupBetCard
              key={i}
              bet={b}
              comments={comments.filter((c) => Number(c.bet_id) === Number(b.bet_id))}
              onComment={async (body) => {
                await addBetComment({ groupId: g.id, betId: b.bet_id, body });
                await reloadComments(g.id);
              }}
            />
          ))}
        </div>
        <div style={{ padding: '0 22px 30px' }}>
          <button
            onClick={() => handleLeave(g)}
            style={{
              width: '100%',
              background: 'rgba(255,90,106,0.08)',
              color: '#FF5A6A',
              border: '1px solid rgba(255,90,106,0.3)',
              borderRadius: 100,
              padding: 14,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {g.is_owner ? 'Chiudi gruppo (owner)' : 'Esci dal gruppo'}
          </button>
        </div>
      </Screen>
    );
  }

  if (mode === 'create') {
    return <CreateGroupForm onCancel={() => setMode(null)} onCreated={async (g) => { setMode(null); await refresh(); }} createGroup={createGroup} />;
  }
  if (mode === 'join') {
    return <JoinGroupForm onCancel={() => setMode(null)} onJoined={async () => { setMode(null); await refresh(); }} joinGroupByCode={joinGroupByCode} />;
  }

  return (
    <Screen title="Gruppi" subtitle="Sfida gli amici in gruppi privati.">
      <div style={{ padding: '0 22px 16px', display: 'flex', gap: 10 }}>
        <button onClick={() => setMode('create')} style={actionBtn('primary')}>
          <Icon name="plus" size={16} /> Crea
        </button>
        <button onClick={() => setMode('join')} style={actionBtn('ghost')}>
          <Icon name="users" size={16} /> Inserisci codice
        </button>
      </div>

      {error && (
        <div style={{ padding: '0 22px 12px', color: '#FF5A6A', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ padding: '0 22px 30px' }}>
        {loading && <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico i tuoi gruppi…</div>}
        {!loading && groups.length === 0 && (
          <div
            style={{
              background: '#111830',
              borderRadius: 20,
              padding: 22,
              border: '1px solid rgba(255,255,255,0.04)',
              color: 'rgba(245,246,250,0.7)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>
              <Icon name="users" size={36} />
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#F5F6FA' }}>
              Non sei ancora in nessun gruppo
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Crea il tuo primo gruppo e invita gli amici con un codice a 6 caratteri.
            </div>
          </div>
        )}
        {!loading && groups.map((g) => (
          <button
            key={g.id}
            onClick={() => openDetail(g)}
            style={{
              width: '100%',
              textAlign: 'left',
              background: '#111830',
              borderRadius: 20,
              padding: 16,
              marginBottom: 10,
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#F5F6FA',
              cursor: 'pointer',
              fontFamily: 'Inter',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17 }}>{g.name}</div>
                {g.description && (
                  <div style={{ fontSize: 12, color: 'rgba(245,246,250,0.5)', marginTop: 4 }}>
                    {g.description}
                  </div>
                )}
                <div style={{ marginTop: 10, display: 'flex', gap: 14, fontSize: 12, color: 'rgba(245,246,250,0.6)' }}>
                  <span><strong style={{ color: '#F5F6FA' }}>{g.member_count}</strong> membri</span>
                  {g.is_owner && <span style={{ color: '#FFDD2E' }}>Owner</span>}
                </div>
              </div>
              <div
                style={{
                  padding: '4px 10px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 12,
                  background: 'rgba(255,221,46,0.1)',
                  border: '1px solid rgba(255,221,46,0.25)',
                  color: '#FFDD2E',
                  borderRadius: 8,
                  letterSpacing: 1,
                }}
              >
                {g.invite_code}
              </div>
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function InviteCard({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,221,46,0.12) 0%, rgba(255,221,46,0.02) 100%)',
        border: '1px solid rgba(255,221,46,0.25)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#FFDD2E', textTransform: 'uppercase', letterSpacing: 1 }}>
          Codice invito
        </div>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 28, letterSpacing: 3, color: '#F5F6FA', marginTop: 2 }}>
          {code}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          background: copied ? '#3DDC97' : '#FFDD2E',
          color: '#0A0F1F',
          border: 0,
          borderRadius: 12,
          padding: '10px 14px',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copiato!' : 'Copia'}
      </button>
    </div>
  );
}

// Premio del gruppo: "chi perde paga la pizza". Visibile a tutti,
// modificabile solo dall'owner.
function GroupStakeCard({ stake, isOwner, onSave }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [leagueId, setLeagueId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const startEdit = () => {
    setTitle(stake?.title || '');
    setLeagueId(stake?.leagueId || '');
    setEditing(true);
  };

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      await onSave({ title, leagueId });
      setEditing(false);
    } catch (e) {
      setErr(e?.message || 'Errore.');
    } finally {
      setSaving(false);
    }
  };

  if (!stake?.title && !isOwner) return null;

  const leagueLabel = stake?.leagueId
    ? (findLeagueById(stake.leagueId)?.label || stake.leagueId)
    : null;

  return (
    <div
      style={{
        marginTop: 12,
        background: 'rgba(76,125,255,0.08)',
        border: '1px solid rgba(76,125,255,0.25)',
        borderRadius: 16,
        padding: 14,
        color: '#F5F6FA',
      }}
    >
      <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: '#4C7DFF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
        🏆 Premio in palio
      </div>

      {!editing && (
        <>
          {stake?.title ? (
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>
              {stake.title}
              {leagueLabel && (
                <span style={{ color: 'rgba(245,246,250,0.55)', fontWeight: 500, fontSize: 12, marginLeft: 6 }}>
                  · {leagueLabel}
                </span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.55)' }}>
              Nessun premio impostato. Esempio: "L'ultimo dei Mondiali paga la pizza".
            </div>
          )}
          {isOwner && (
            <button onClick={startEdit} style={{ ...smallBtn, marginTop: 8 }}>
              {stake?.title ? 'Modifica' : 'Imposta premio'}
            </button>
          )}
        </>
      )}

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder='es. "Ultimo classificato paga la pizza"'
            style={input}
          />
          <select value={leagueId} onChange={(e) => setLeagueId(e.target.value)} style={input}>
            <option value="">Su tutto (classifica generale)</option>
            {CONTESTS.map((c) => (
              <option key={c.key} value={c.league.id}>{c.league.label}</option>
            ))}
          </select>
          {err && <div style={{ color: '#FF5A6A', fontSize: 12 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={saving} style={{ ...smallBtn, background: '#FFDD2E', color: '#0A0F1F', border: 0 }}>
              {saving ? 'Salvo…' : 'Salva'}
            </button>
            <button onClick={() => setEditing(false)} style={smallBtn}>Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}

const smallBtn = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#F5F6FA',
  borderRadius: 10,
  padding: '7px 14px',
  fontFamily: 'Space Grotesk',
  fontWeight: 700,
  fontSize: 12,
  cursor: 'pointer',
};

// Etichetta leggibile per un pick: "1 / X / 2" per i match, "P1 nome" per
// i pick gara (formato "p{N}:{id}").
function pickLabel(outcome) {
  const race = /^p(\d+):(.+)$/.exec(outcome || '');
  if (race) return `P${race[1]} ${race[2].toUpperCase()}`;
  return outcome;
}

function GroupBetCard({ bet, comments = [], onComment }) {
  const league = findLeagueById(bet.league_id);
  const picks = Array.isArray(bet.picks) ? bet.picks : [];
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visibleComments = showAll ? comments : comments.slice(-2);

  const send = async () => {
    const body = draft.trim();
    if (!body || !onComment || sending) return;
    setSending(true);
    try {
      await onComment(body);
      setDraft('');
    } catch {
      // errore silenzioso: il commento resta nel campo
    } finally {
      setSending(false);
    }
  };
  return (
    <div
      style={{
        background: bet.is_me ? 'rgba(255,221,46,0.05)' : '#111830',
        border: bet.is_me ? '1px solid rgba(255,221,46,0.2)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        color: '#F5F6FA',
        fontFamily: 'Inter',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>
          {bet.nick}
          {bet.is_me && <span style={{ color: '#FFDD2E', marginLeft: 5, fontSize: 11 }}>(tu)</span>}
          <span style={{ color: 'rgba(245,246,250,0.5)', fontWeight: 500, marginLeft: 8, fontSize: 12 }}>
            {league?.label || bet.league_id} · {league?.sport === 'football' ? `${bet.round}ª giornata` : `Turno ${bet.round}`}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            fontFamily: 'JetBrains Mono',
            color: bet.settled ? '#FFDD2E' : 'rgba(245,246,250,0.5)',
          }}
        >
          {bet.settled ? `${bet.points} pt` : 'in corso'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {picks.map((p, i) => {
          const single = !p.away || p.away === '-';
          const ok = p.pts != null && p.pts > 0;
          const ko = bet.settled && (p.pts == null || p.pts === 0);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                padding: '6px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
              }}
            >
              <span style={{ color: 'rgba(245,246,250,0.75)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.home == null ? 'Partita' : single ? p.home : `${p.home} – ${p.away}`}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 700,
                  flexShrink: 0,
                  color: ok ? '#3DDC97' : ko ? '#FF5A6A' : '#FFDD2E',
                }}
              >
                {pickLabel(p.outcome)} {ok ? '✓' : ko ? '✗' : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* Sfottò & commenti */}
      <div style={{ marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 8 }}>
        {comments.length > 2 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            style={{ background: 'none', border: 0, color: 'rgba(245,246,250,0.5)', fontSize: 11, cursor: 'pointer', padding: '0 0 6px' }}
          >
            Mostra tutti i {comments.length} commenti
          </button>
        )}
        {visibleComments.map((c, i) => (
          <div key={i} style={{ fontSize: 12, marginBottom: 5, lineHeight: 1.4 }}>
            <strong style={{ color: c.is_me ? '#FFDD2E' : '#4C7DFF' }}>{c.nick}</strong>{' '}
            <span style={{ color: 'rgba(245,246,250,0.8)' }}>{c.body}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
            maxLength={200}
            placeholder="Lascia uno sfottò… 😏"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '8px 10px',
              color: '#F5F6FA',
              fontFamily: 'Inter',
              fontSize: 12,
              outline: 'none',
            }}
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            style={{
              background: draft.trim() ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
              color: draft.trim() ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
              border: 0,
              borderRadius: 10,
              padding: '8px 12px',
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 12,
              cursor: draft.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {sending ? '…' : 'Invia'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Riga della classifica per competizione: punti scoring + schedine giocate.
function StandingRow({ rank, nick, is_me, points, played }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 6,
        background: is_me ? 'rgba(255,221,46,0.08)' : 'rgba(255,255,255,0.02)',
        border: is_me ? '1px solid rgba(255,221,46,0.25)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 14,
        color: '#F5F6FA',
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: rank <= 3 ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
          color: rank <= 3 ? '#0A0F1F' : 'rgba(245,246,250,0.7)',
          fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Link to={`/u/${encodeURIComponent(nick)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{nick}</Link>
        {is_me && <span style={{ color: '#FFDD2E', marginLeft: 6, fontSize: 11 }}>(tu)</span>}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono', flexShrink: 0 }}>
        {played} sched.
      </div>
      <div style={{ color: '#4C7DFF', fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {points} pt
      </div>
    </div>
  );
}

function GroupLeaderRow({ rank, nick, funnies, is_me }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        marginBottom: 6,
        background: is_me ? 'rgba(255,221,46,0.08)' : 'rgba(255,255,255,0.02)',
        border: is_me ? '1px solid rgba(255,221,46,0.25)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 14,
        color: '#F5F6FA',
      }}
    >
      <div
        style={{
          width: 28, height: 28, borderRadius: 8,
          background: rank <= 3 ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
          color: rank <= 3 ? '#0A0F1F' : 'rgba(245,246,250,0.7)',
          fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Link to={`/u/${encodeURIComponent(nick)}`} style={{ color: 'inherit', textDecoration: 'none' }}>{nick}</Link>
        {is_me && <span style={{ color: '#FFDD2E', marginLeft: 6, fontSize: 11 }}>(tu)</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFDD2E', fontFamily: 'JetBrains Mono', fontSize: 13 }}>
        <Funnie size={14} /> {funnies.toLocaleString('it-IT')}
      </div>
    </div>
  );
}

function CreateGroupForm({ onCancel, onCreated, createGroup }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      const g = await createGroup({ name, description });
      onCreated(g);
    } catch (e) {
      setErr(e?.message || 'Errore.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen title="Crea gruppo" subtitle="Un nome, una descrizione breve, e via." onBack={onCancel}>
      <form onSubmit={submit} style={{ padding: '0 22px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Nome del gruppo">
          <input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} required style={input} />
        </Field>
        <Field label="Descrizione (opzionale)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={200} style={{ ...input, resize: 'vertical' }} />
        </Field>
        {err && <div style={{ color: '#FF5A6A', fontSize: 13 }}>{err}</div>}
        <button type="submit" disabled={saving} style={{ ...actionBtn('primary'), width: '100%', justifyContent: 'center' }}>
          {saving ? 'Creo…' : 'Crea gruppo'}
        </button>
      </form>
    </Screen>
  );
}

function JoinGroupForm({ onCancel, onJoined, joinGroupByCode }) {
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr(null);
    try {
      await joinGroupByCode(code.trim());
      onJoined();
    } catch (e) {
      const m = e?.message || '';
      setErr(m.includes('not found') ? 'Codice non valido.' : (m || 'Errore.'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Screen title="Entra in un gruppo" subtitle="Inserisci il codice a 6 caratteri." onBack={onCancel}>
      <form onSubmit={submit} style={{ padding: '0 22px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Codice invito">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            required
            style={{ ...input, textAlign: 'center', letterSpacing: 4, fontFamily: 'JetBrains Mono', fontSize: 20 }}
            placeholder="AB12CD"
          />
        </Field>
        {err && <div style={{ color: '#FF5A6A', fontSize: 13 }}>{err}</div>}
        <button type="submit" disabled={saving || code.length !== 6} style={{ ...actionBtn('primary'), width: '100%', justifyContent: 'center' }}>
          {saving ? 'Entro…' : 'Entra nel gruppo'}
        </button>
      </form>
    </Screen>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'rgba(245,246,250,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      {children}
    </label>
  );
}

const input = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  padding: '12px 14px',
  color: '#F5F6FA',
  fontFamily: 'Inter',
  fontSize: 14,
  outline: 'none',
};

function actionBtn(variant) {
  return {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '12px 16px',
    borderRadius: 100,
    border: variant === 'primary' ? 0 : '1px solid rgba(255,255,255,0.08)',
    background: variant === 'primary' ? '#FFDD2E' : 'rgba(255,255,255,0.04)',
    color: variant === 'primary' ? '#0A0F1F' : '#F5F6FA',
    fontFamily: 'Space Grotesk',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
  };
}
