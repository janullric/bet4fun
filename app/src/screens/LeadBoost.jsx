import { useCallback, useEffect, useMemo, useState } from 'react';
import Screen from '../components/Screen.jsx';
import Icon from '../components/Icon.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';

// Lead Boost: campagne brand con consenso GDPR esplicito.
// Nessun pop-up dark-pattern, nessun pre-check. Se l'utente non ha dato il
// consenso globale lead_boost, lo invitiamo ad attivarlo una volta sola e basta.
export default function LeadBoost() {
  const {
    isSupabaseConfigured,
    isAuthed,
    profile,
    listLeadCampaigns,
    submitLead,
    setConsent,
  } = useApp();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null); // campaign in detail view

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await listLeadCampaigns());
    } catch (e) {
      setError(e?.message || 'Errore nel caricamento campagne.');
    } finally {
      setLoading(false);
    }
  }, [listLeadCampaigns]);

  useEffect(() => {
    if (isAuthed && isSupabaseConfigured) refresh();
    else setLoading(false);
  }, [refresh, isAuthed, isSupabaseConfigured]);

  if (!isSupabaseConfigured) {
    return (
      <Screen title="Lead Boost" subtitle="Campagne brand con Funnies bonus.">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>
          Configura Supabase per vedere le campagne (vedi <code>SUPABASE_SETUP.md</code>).
        </div>
      </Screen>
    );
  }

  if (!isAuthed) {
    return (
      <Screen title="Lead Boost" subtitle="Campagne brand con Funnies bonus.">
        <div style={{ padding: '0 22px', color: 'rgba(245,246,250,0.6)' }}>
          Accedi per partecipare alle campagne Lead Boost.
        </div>
      </Screen>
    );
  }

  if (active) {
    return (
      <CampaignDetail
        campaign={active}
        profile={profile}
        onBack={() => setActive(null)}
        onDone={async () => { setActive(null); await refresh(); }}
        submitLead={submitLead}
        setConsent={setConsent}
      />
    );
  }

  const hasConsent = !!profile?.lead_boost_consent;

  return (
    <Screen
      title="Lead Boost"
      subtitle="Condividi un interesse con un brand partner, accredita Funnies extra."
    >
      {!hasConsent && (
        <div style={{ padding: '0 22px 14px' }}>
          <ConsentBanner
            onAccept={async () => {
              try {
                await setConsent({ scope: 'lead_boost', granted: true, version: 'profile-v1' });
              } catch (e) {
                setError(e?.message || 'Errore nel salvataggio consenso.');
              }
            }}
          />
        </div>
      )}

      {error && (
        <div style={{ padding: '0 22px 12px', color: '#FF5A6A', fontSize: 13 }}>{error}</div>
      )}

      <div style={{ padding: '0 22px 30px' }}>
        {loading && (
          <div style={{ color: 'rgba(245,246,250,0.6)', fontSize: 13 }}>Carico le campagne…</div>
        )}
        {!loading && items.length === 0 && (
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
              <Icon name="gift" size={36} />
            </div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#F5F6FA' }}>
              Nessuna campagna attiva
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Torna più tardi: pubblichiamo nuovi brand ogni settimana.
            </div>
          </div>
        )}
        {!loading && items.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            disabled={!hasConsent}
            onOpen={() => setActive(c)}
          />
        ))}
      </div>
    </Screen>
  );
}

function ConsentBanner({ onAccept }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(255,221,46,0.10) 0%, rgba(255,221,46,0.02) 100%)',
        border: '1px solid rgba(255,221,46,0.25)',
        borderRadius: 18,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon name="shield" size={18} color="#FFDD2E" />
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#FFDD2E' }}>
          Attiva Lead Boost
        </div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.75)', lineHeight: 1.5 }}>
        Per partecipare alle campagne dei brand ci serve il tuo consenso esplicito: quando scegli
        una campagna, i dati che compili verranno inviati al brand di riferimento (e solo a quello).
        Puoi revocare il consenso in qualunque momento dal profilo.
      </div>
      <button
        onClick={onAccept}
        style={{
          marginTop: 12,
          background: '#FFDD2E',
          color: '#0A0F1F',
          border: 0,
          borderRadius: 100,
          padding: '10px 18px',
          fontFamily: 'Space Grotesk',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        Ho capito, attiva
      </button>
    </div>
  );
}

function CampaignCard({ campaign, onOpen, disabled }) {
  const done = campaign.already_submitted;
  return (
    <button
      onClick={onOpen}
      disabled={disabled || done}
      style={{
        width: '100%',
        textAlign: 'left',
        background: '#111830',
        borderRadius: 20,
        padding: 18,
        marginBottom: 12,
        border: '1px solid rgba(255,255,255,0.04)',
        color: '#F5F6FA',
        cursor: disabled || done ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontFamily: 'Inter',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: 'JetBrains Mono',
              color: 'rgba(245,246,250,0.5)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            {campaign.brand}
          </div>
          <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 17 }}>
            {campaign.title}
          </div>
          {campaign.tagline && (
            <div style={{ fontSize: 13, color: 'rgba(245,246,250,0.65)', marginTop: 6 }}>
              {campaign.tagline}
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            borderRadius: 100,
            background: done ? 'rgba(61,220,151,0.1)' : 'rgba(255,221,46,0.12)',
            border: done ? '1px solid rgba(61,220,151,0.3)' : '1px solid rgba(255,221,46,0.3)',
            color: done ? '#3DDC97' : '#FFDD2E',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          {done ? '✓ Fatto' : <><Funnie size={13} /> +{campaign.funnies_reward}</>}
        </div>
      </div>
    </button>
  );
}

function CampaignDetail({ campaign, profile, onBack, onDone, submitLead, setConsent }) {
  const fields = Array.isArray(campaign.fields) ? campaign.fields : [];
  const [values, setValues] = useState(() => initialValues(fields));
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const hasConsent = !!profile?.lead_boost_consent;

  const setField = (key, v) => setValues((old) => ({ ...old, [key]: v }));

  const missingRequired = useMemo(
    () =>
      fields.some((f) => {
        if (!f.required) return false;
        const v = values[f.key];
        if (f.type === 'checkbox') return !v;
        return !v || String(v).trim() === '';
      }),
    [fields, values]
  );

  const canSubmit = hasConsent && agreed && !missingRequired && !submitting;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErr(null);
    try {
      await submitLead({
        campaignId: campaign.id,
        payload: values,
        consentVersion: `lead-${campaign.id}-v1`,
      });
      onDone();
    } catch (e) {
      setErr(e?.message || 'Errore durante l\'invio.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title={campaign.title} subtitle={campaign.brand} onBack={onBack}>
      <form onSubmit={onSubmit} style={{ padding: '0 22px 40px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255,221,46,0.1)',
            border: '1px solid rgba(255,221,46,0.25)',
            color: '#FFDD2E',
            padding: '8px 14px',
            borderRadius: 100,
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          <Funnie size={14} /> +{campaign.funnies_reward} Funnies al completamento
        </div>

        {campaign.tagline && (
          <div style={{ fontSize: 14, color: 'rgba(245,246,250,0.75)', marginBottom: 20, lineHeight: 1.5 }}>
            {campaign.tagline}
          </div>
        )}

        <InfoBlock title="Cosa verrà condiviso" body={campaign.data_sharing} />

        {!hasConsent && (
          <div
            style={{
              margin: '14px 0',
              padding: 14,
              background: 'rgba(255,90,106,0.08)',
              border: '1px solid rgba(255,90,106,0.3)',
              color: '#FF8A95',
              borderRadius: 14,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Per inviare devi prima attivare il consenso Lead Boost.{' '}
            <button
              type="button"
              onClick={async () => {
                try {
                  await setConsent({ scope: 'lead_boost', granted: true, version: 'profile-v1' });
                } catch (e) {
                  setErr(e?.message || 'Errore nel salvare il consenso.');
                }
              }}
              style={{
                background: 'transparent',
                color: '#FF8A95',
                border: 0,
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'underline',
                font: 'inherit',
              }}
            >
              Attivalo ora
            </button>
            .
          </div>
        )}

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fields.map((f) => (
            <DynamicField key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          <label
            style={{
              display: 'flex',
              gap: 12,
              padding: 14,
              background: agreed ? 'rgba(255,221,46,0.08)' : 'rgba(26,34,64,0.6)',
              border: agreed ? '1.5px solid #FFDD2E' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14,
              cursor: 'pointer',
              color: '#F5F6FA',
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            <span>
              Ho letto e accetto: {campaign.disclaimer}
            </span>
          </label>
        </div>

        {err && (
          <div style={{ marginTop: 14, color: '#FF5A6A', fontSize: 13 }}>{err}</div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            marginTop: 22,
            width: '100%',
            background: canSubmit ? '#FFDD2E' : 'rgba(255,255,255,0.08)',
            color: canSubmit ? '#0A0F1F' : 'rgba(245,246,250,0.4)',
            border: 0,
            borderRadius: 100,
            padding: '16px',
            fontFamily: 'Space Grotesk',
            fontWeight: 700,
            fontSize: 15,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'Invio…' : `Invia e accredita +${campaign.funnies_reward} Funnies`}
        </button>
      </form>
    </Screen>
  );
}

function InfoBlock({ title, body }) {
  return (
    <div
      style={{
        background: 'rgba(76,125,255,0.06)',
        border: '1px solid rgba(76,125,255,0.2)',
        borderRadius: 14,
        padding: 14,
        color: '#C6D6FF',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontFamily: 'JetBrains Mono',
          textTransform: 'uppercase',
          letterSpacing: 1,
          marginBottom: 4,
          color: '#8EACFF',
        }}
      >
        {title}
      </div>
      {body}
    </div>
  );
}

function DynamicField({ field, value, onChange }) {
  const labelEl = (
    <div
      style={{
        fontSize: 11,
        fontFamily: 'JetBrains Mono',
        color: 'rgba(245,246,250,0.6)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
      }}
    >
      {field.label}{field.required && ' *'}
    </div>
  );

  if (field.type === 'checkbox') {
    return (
      <label
        style={{
          display: 'flex',
          gap: 10,
          padding: 14,
          background: value ? 'rgba(255,221,46,0.08)' : 'rgba(26,34,64,0.6)',
          border: value ? '1.5px solid #FFDD2E' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14,
          cursor: 'pointer',
          color: '#F5F6FA',
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>{field.label}{field.required && ' *'}</span>
      </label>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        {labelEl}
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          required={field.required}
          style={{ ...input, resize: 'vertical', width: '100%' }}
        />
      </div>
    );
  }

  return (
    <div>
      {labelEl}
      <input
        type={field.type || 'text'}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
        style={{ ...input, width: '100%' }}
      />
    </div>
  );
}

function initialValues(fields) {
  const out = {};
  for (const f of fields) {
    out[f.key] = f.type === 'checkbox' ? false : '';
  }
  return out;
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
  boxSizing: 'border-box',
};
