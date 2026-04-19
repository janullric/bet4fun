import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import SectionHeader from '../components/SectionHeader.jsx';
import { useApp } from '../context/AppContext.jsx';

const STATS = [
  { label: 'Pronostici',      value: '1.247' },
  { label: 'Accuratezza',     value: '64%' },
  { label: 'Streak',          value: '7' },
  { label: 'Premi ritirati',  value: '8' },
];

export default function Profilo() {
  const navigate = useNavigate();
  const {
    funnies,
    user,
    isAuthed,
    signOut,
    profile,
    isSupabaseConfigured,
    listMyGroups,
    setConsent,
    refreshProfile,
  } = useApp();

  const [groups, setGroups] = useState([]);
  const [consentBusy, setConsentBusy] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !isAuthed) return;
    listMyGroups().then(setGroups).catch(() => setGroups([]));
  }, [isSupabaseConfigured, isAuthed, listMyGroups]);

  const toggleConsent = async (scope) => {
    if (!isSupabaseConfigured) return;
    setConsentBusy(scope);
    try {
      const key =
        scope === 'tos' ? 'tos_accepted'
        : scope === 'marketing' ? 'marketing_consent'
        : 'lead_boost_consent';
      await setConsent({ scope, granted: !profile?.[key], version: 'profile-v1' });
      await refreshProfile();
    } catch (_) {
      // l'errore viene mostrato silenziosamente: il toggle torna allo stato precedente.
    } finally {
      setConsentBusy(null);
    }
  };

  const doSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const settingsRows = [
    { label: 'Preferenze sportive', icon: 'bolt' },
    { label: 'Notifiche',           icon: 'bell' },
    { label: 'Privacy e sicurezza', icon: 'lock' },
    { label: 'Aiuto e FAQ',         icon: 'mail' },
    ...(profile?.is_admin
      ? [{ label: 'Pannello admin', icon: 'shield', action: () => navigate('/admin') }]
      : []),
    {
      label: isAuthed ? 'Esci dall\u2019account' : 'Torna alla home',
      icon: 'x',
      action: isAuthed ? doSignOut : () => navigate('/'),
      danger: true,
    },
  ];

  const displayName = user?.nick || 'Utente';
  const handle = user?.handle || (user?.email ? user.email.split('@')[0] : '');
  const initial = (displayName[0] || '?').toUpperCase();

  return (
    <Screen
      title="Profilo"
      headerRight={
        <button
          aria-label="Impostazioni"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: 0,
            color: '#F5F6FA',
            width: 40,
            height: 40,
            borderRadius: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="settings" size={20} />
        </button>
      }
    >
      {/* avatar */}
      <div style={{ padding: '0 22px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'linear-gradient(135deg, #FFDD2E 0%, #E6A617 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Space Grotesk',
            fontWeight: 800,
            fontSize: 32,
            color: '#1A0F00',
            boxShadow: '0 10px 30px rgba(255,221,46,0.3)',
          }}
        >
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: -0.5,
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'rgba(245,246,250,0.5)',
              fontFamily: 'JetBrains Mono',
            }}
          >
            {handle ? `@${handle}` : (user?.email || '')}
          </div>
          <div
            style={{
              marginTop: 6,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              background: 'rgba(76,125,255,0.15)',
              color: '#4C7DFF',
              borderRadius: 100,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <Icon name="sparkle" size={11} /> Divisione D7 · Pro
          </div>
        </div>
      </div>

      {/* stats grid */}
      <div
        style={{
          padding: '0 22px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 6,
        }}
      >
        {STATS.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#111830',
              borderRadius: 14,
              padding: '12px 6px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: -0.4,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(245,246,250,0.5)',
                fontFamily: 'JetBrains Mono',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                marginTop: 2,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* funnies breakdown */}
      <SectionHeader title="Funnies" />
      <div style={{ padding: '0 22px 24px' }}>
        <div
          style={{
            background: '#111830',
            borderRadius: 20,
            padding: 18,
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Funnie size={28} />
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(245,246,250,0.5)',
                    fontFamily: 'JetBrains Mono',
                    textTransform: 'uppercase',
                  }}
                >
                  Saldo attuale
                </div>
                <div
                  style={{
                    fontFamily: 'Space Grotesk',
                    fontWeight: 800,
                    fontSize: 26,
                    letterSpacing: -0.8,
                    lineHeight: 1,
                  }}
                >
                  {funnies.toLocaleString('it-IT')}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/premi')}
              style={{
                background: '#FFDD2E',
                color: '#0A0F1F',
                border: 0,
                borderRadius: 100,
                padding: '10px 16px',
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Spendi
            </button>
          </div>
          <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ flex: 62, background: '#3DDC97' }} />
            <div style={{ flex: 25, background: '#4C7DFF' }} />
            <div style={{ flex: 13, background: '#FFDD2E' }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              fontSize: 11,
            }}
          >
            <Legend color="#3DDC97" label="Pronostici · 62%" />
            <Legend color="#4C7DFF" label="FunBooster · 25%" />
            <Legend color="#FFDD2E" label="Sfida · 13%" />
          </div>
        </div>
      </div>

      {/* gruppi */}
      <SectionHeader
        title="I tuoi gruppi"
        action="Vedi tutti"
        onAction={() => navigate('/gruppi')}
      />
      <div style={{ padding: '0 22px 24px' }}>
        {groups.length === 0 && (
          <button
            onClick={() => navigate('/gruppi')}
            style={{
              width: '100%',
              background: '#111830',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: 16,
              padding: 16,
              color: 'rgba(245,246,250,0.7)',
              cursor: 'pointer',
              fontFamily: 'Inter',
              fontSize: 13,
            }}
          >
            Non sei in nessun gruppo. Creane uno o inserisci un codice invito.
          </button>
        )}
        {groups.slice(0, 3).map((g) => (
          <button
            key={g.id}
            onClick={() => navigate('/gruppi')}
            style={{
              width: '100%',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              marginBottom: 8,
              background: '#111830',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.04)',
              color: '#F5F6FA',
              cursor: 'pointer',
              fontFamily: 'Inter',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'rgba(76,125,255,0.15)',
                color: '#4C7DFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={g.is_owner ? 'trophy' : 'users'} size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{g.name}</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(245,246,250,0.5)',
                  fontFamily: 'JetBrains Mono',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginTop: 1,
                }}
              >
                {g.is_owner ? 'Owner' : 'Membro'} · {g.member_count} membri
              </div>
            </div>
            <div
              style={{
                padding: '4px 10px',
                background: 'rgba(255,221,46,0.12)',
                color: '#FFDD2E',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono',
                letterSpacing: 1,
              }}
            >
              {g.invite_code}
            </div>
          </button>
        ))}
      </div>

      {/* consensi GDPR */}
      {isSupabaseConfigured && isAuthed && (
        <>
          <SectionHeader title="Consensi e privacy" />
          <div style={{ padding: '0 22px 24px' }}>
            <ConsentToggle
              title="Termini di servizio e privacy"
              body="Accettazione dei ToS e dell'informativa privacy."
              checked={!!profile?.tos_accepted}
              onToggle={() => toggleConsent('tos')}
              busy={consentBusy === 'tos'}
            />
            <ConsentToggle
              title="Email di comunicazione"
              body="Ricevi aggiornamenti sull'account e le novità di Bet4Fun."
              checked={!!profile?.marketing_consent}
              onToggle={() => toggleConsent('marketing')}
              busy={consentBusy === 'marketing'}
            />
            <ConsentToggle
              title="Lead Boost"
              body="Autorizzazione a condividere i dati con i brand delle campagne a cui aderisci. Senza questo, la sezione Lead Boost resta sola lettura."
              checked={!!profile?.lead_boost_consent}
              onToggle={() => toggleConsent('lead_boost')}
              busy={consentBusy === 'lead_boost'}
            />
          </div>
        </>
      )}

      {/* settings */}
      <SectionHeader title="Account" />
      <div style={{ padding: '0 22px 40px' }}>
        {settingsRows.map((r, i) => (
          <button
            key={i}
            onClick={r.action}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 16px',
              marginBottom: 6,
              background: '#111830',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.04)',
              color: r.danger ? '#FF5A6A' : '#F5F6FA',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Inter',
            }}
          >
            <Icon
              name={r.icon}
              size={18}
              color={r.danger ? '#FF5A6A' : 'rgba(245,246,250,0.6)'}
            />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{r.label}</span>
            {!r.danger && <Icon name="chevR" size={14} color="rgba(245,246,250,0.3)" />}
          </button>
        ))}
      </div>
    </Screen>
  );
}

function ConsentToggle({ title, body, checked, onToggle, busy }) {
  return (
    <button
      onClick={onToggle}
      disabled={busy}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        gap: 14,
        padding: 14,
        marginBottom: 8,
        background: '#111830',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.04)',
        color: '#F5F6FA',
        cursor: busy ? 'wait' : 'pointer',
        fontFamily: 'Inter',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div
          style={{
            fontSize: 12,
            color: 'rgba(245,246,250,0.55)',
            marginTop: 4,
            lineHeight: 1.45,
          }}
        >
          {body}
        </div>
      </div>
      <div
        style={{
          width: 44,
          height: 26,
          borderRadius: 13,
          background: checked ? '#FFDD2E' : 'rgba(255,255,255,0.12)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 20,
            height: 20,
            borderRadius: 10,
            background: checked ? '#0A0F1F' : '#F5F6FA',
            transition: 'left 0.2s',
          }}
        />
      </div>
    </button>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
      <span style={{ color: 'rgba(245,246,250,0.7)' }}>{label}</span>
    </div>
  );
}
