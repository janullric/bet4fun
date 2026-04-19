import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';

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
  } = useApp();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // 'create' | 'join' | { detail: group }
  const [leaderboard, setLeaderboard] = useState(null);
  const [boardLoading, setBoardLoading] = useState(false);

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
    try {
      const rows = await groupLeaderboard(group.id);
      setLeaderboard(rows);
    } catch (e) {
      setLeaderboard([]);
      setError(e?.message || 'Errore nel caricare la classifica.');
    } finally {
      setBoardLoading(false);
    }
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
          <div style={{ marginTop: 18, marginBottom: 10, color: 'rgba(245,246,250,0.6)', fontSize: 12, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: 1 }}>
            Classifica interna
          </div>
          {boardLoading && <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico…</div>}
          {!boardLoading && leaderboard && leaderboard.length === 0 && (
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Ancora nessun membro. Condividi il codice!</div>
          )}
          {!boardLoading && leaderboard && leaderboard.map((row, i) => (
            <GroupLeaderRow key={i} rank={i + 1} {...row} />
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
