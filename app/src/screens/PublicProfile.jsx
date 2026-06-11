import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useApp } from '../context/AppContext.jsx';

// Profilo pubblico (leggibile da qualsiasi utente autenticato).
// Sorgente: RPC `public_profile(p_handle)` che restituisce nick, paese,
// funnies totali, posizione globale, ultima connessione, totale pronostici.
export default function PublicProfile() {
  const { handle } = useParams();
  const {
    getPublicProfile, isSupabaseConfigured, user,
    sendFriendRequest, listFriends,
  } = useApp();

  const [data, setData]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [err, setErr]     = useState(null);
  // Stato amicizia con questo utente: null | 'amico' | 'inviata' | 'ricevuta'
  const [friendState, setFriendState] = useState(null);
  const [friendMsg, setFriendMsg] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoad(false); return; }
    let alive = true;
    setLoad(true);
    getPublicProfile(handle)
      .then((row) => { if (alive) { setData(row); setErr(row ? null : 'Profilo non trovato.'); } })
      .catch((e) => { if (alive) setErr(e?.message || 'Errore.'); })
      .finally(() => { if (alive) setLoad(false); });
    listFriends()
      .then((rows) => {
        if (!alive) return;
        const mine = (rows || []).find((f) => f.nick?.toLowerCase() === String(handle).toLowerCase());
        setFriendState(mine?.state || null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [handle, getPublicProfile, listFriends, isSupabaseConfigured]);

  const addFriend = async () => {
    setFriendMsg(null);
    try {
      const out = await sendFriendRequest(handle);
      setFriendState(out === 'accepted' ? 'amico' : 'inviata');
      setFriendMsg(out === 'accepted' ? 'Siete amici! 🎉' : 'Richiesta inviata ✓');
    } catch (e) {
      setFriendMsg(e?.message || 'Errore.');
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen title={`@${handle}`} subtitle="Profilo pubblico">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>
          Configura Supabase per vedere i profili pubblici.
        </div>
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen title={`@${handle}`}>
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>Carico il profilo…</div>
      </Screen>
    );
  }

  if (err || !data) {
    return (
      <Screen title={`@${handle}`}>
        <div style={{ padding: '0 22px', color: '#FF5A6A' }}>{err || 'Profilo non disponibile.'}</div>
      </Screen>
    );
  }

  const initial = (data.nick?.[0] || '?').toUpperCase();
  const funnies = Number(data.funnies ?? 0);
  const rank    = data.global_rank ?? null;
  const country = data.country || null;
  const lastSeen = data.last_seen_at ? new Date(data.last_seen_at) : null;
  const created  = data.created_at   ? new Date(data.created_at)   : null;

  return (
    <Screen title={data.nick} subtitle={`Profilo pubblico · @${data.nick}`}>
      <div style={{ padding: '0 22px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div
          style={{
            width: 84, height: 84, borderRadius: 24,
            background: 'linear-gradient(135deg, #4C7DFF 0%, #1a2240 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 36, color: '#F5F6FA',
            boxShadow: '0 10px 30px rgba(76,125,255,0.3)',
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, letterSpacing: -0.5 }}>
            {data.nick}
          </div>
          {country && (
            <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(245,246,250,0.6)' }}>
              {country}
            </div>
          )}
          {rank != null && (
            <div
              style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', background: 'rgba(255,221,46,0.15)', color: '#FFDD2E',
                borderRadius: 100, fontSize: 11, fontWeight: 700,
              }}
            >
              <Icon name="trophy" size={11} /> #{rank} classifica globale
            </div>
          )}
        </div>
      </div>

      {/* aggiungi amico (nascosto sul proprio profilo) */}
      {user?.nick?.toLowerCase() !== String(data.nick).toLowerCase() && (
        <div style={{ padding: '0 22px 22px' }}>
          {friendState === 'amico' ? (
            <div style={{ color: '#3DDC97', fontSize: 13, fontWeight: 600 }}>
              ✓ Siete amici — trovalo nella sezione Amici per chat e sfide.
            </div>
          ) : friendState === 'inviata' ? (
            <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>
              Richiesta di amicizia inviata: in attesa di risposta…
            </div>
          ) : friendState === 'ricevuta' ? (
            <div style={{ color: '#FFDD2E', fontSize: 13 }}>
              Ti ha chiesto l'amicizia! Vai nella sezione <strong>Amici</strong> per accettare.
            </div>
          ) : (
            <button
              onClick={addFriend}
              style={{
                width: '100%',
                background: '#FFDD2E',
                color: '#0A0F1F',
                border: 0,
                borderRadius: 100,
                padding: 14,
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              ➕ Aggiungi amico
            </button>
          )}
          {friendMsg && (
            <div style={{ marginTop: 8, fontSize: 13, color: friendMsg.includes('✓') || friendMsg.includes('🎉') ? '#3DDC97' : '#FF5A6A' }}>
              {friendMsg}
            </div>
          )}
        </div>
      )}

      {/* card funnies totali */}
      <div style={{ padding: '0 22px 22px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #1A2240 0%, #0A0F1F 100%)',
            border: '1px solid rgba(255,221,46,0.15)',
            borderRadius: 22,
            padding: 18,
          }}
        >
          <div
            style={{
              fontSize: 11, fontFamily: 'JetBrains Mono', color: '#FFDD2E',
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}
          >
            Funnies totali
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Funnie size={32} />
            <div
              style={{
                fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 44,
                letterSpacing: -1.5, lineHeight: 1,
              }}
            >
              {funnies.toLocaleString('it-IT')}
            </div>
          </div>
        </div>
      </div>

      <SectionHeader title="Attività" />
      <div style={{ padding: '0 22px 30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCard label="Pronostici totali" value={(data.total_bets ?? 0).toLocaleString('it-IT')} />
        <StatCard label="Posizione globale" value={rank != null ? `#${rank}` : '—'} />
        <StatCard label="Ultima connessione" value={lastSeen ? relativeTime(lastSeen) : '—'} />
        <StatCard label="Iscritto il"        value={created  ? created.toLocaleDateString('it-IT') : '—'} />
      </div>
    </Screen>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: '#111830',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <div
        style={{
          fontSize: 10, color: 'rgba(245,246,250,0.5)', fontFamily: 'JetBrains Mono',
          textTransform: 'uppercase', letterSpacing: 0.6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 6, fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// Formatter "ultimo accesso": pochi minuti fa / N ore fa / N giorni fa.
function relativeTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)     return 'adesso';
  if (diff < 3600)   return `${Math.floor(diff / 60)} min fa`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)} h fa`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} g fa`;
  return d.toLocaleDateString('it-IT');
}
