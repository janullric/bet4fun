import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen.jsx';

const FAQS = [
  {
    q: 'Cosa sono i Funnies?',
    a: 'Sono la valuta virtuale di Bet4Fun. Li guadagni giocando le schedine e vincendo i concorsi. Non hanno valore reale e non si comprano: si gioca 100% gratis.',
  },
  {
    q: 'Come si gioca una schedina?',
    a: 'Vai su Pronostici, scegli un concorso aperto, fai i tuoi pronostici (1/X/2 o la top piloti) e conferma prima del fischio d\'inizio. Dopo il calcio d\'inizio la giornata si chiude e non è più modificabile.',
  },
  {
    q: 'Posso modificare una schedina già giocata?',
    a: 'Sì, finché la giornata non è iniziata. Apri "Le mie schedine" o rientra nel concorso: trovi i tuoi pronostici e il tasto Modifica. Dopo il via, restano in sola lettura.',
  },
  {
    q: 'Come funziona il montepremi?',
    a: 'Ogni concorso ha un montepremi trasparente: una base garantita più una quota per ogni iscritto alla giornata. Più giocatori partecipano, più sale. A fine giornata viene distribuito ai migliori.',
  },
  {
    q: 'Come si gioca con gli amici?',
    a: 'Due modi: i Gruppi (crei un gruppo, condividi il codice, classifica interna e premio in palio) e gli Amici (aggiungi per nickname, chat privata e sfide 1v1 con posta in Funnies).',
  },
  {
    q: 'Cos\'è la sfida 1v1?',
    a: 'Sfidi un amico su una singola giornata mettendo in palio dei Funnies: chi fa più punti vince la posta. La posta viene messa da parte quando l\'amico accetta; in caso di pareggio viene rimborsata.',
  },
  {
    q: 'Ho dimenticato la password, come faccio?',
    a: 'Nella schermata di accesso clicca "Password dimenticata?", inserisci la tua email e ricevi un link per impostarne una nuova. Puoi anche cambiarla da Profilo → Privacy e sicurezza.',
  },
  {
    q: 'I miei dati sono al sicuro?',
    a: 'Sì. Le tue informazioni sono protette, le password sono cifrate e ogni operazione passa da controlli lato server. Gestisci i consensi da Profilo → Notifiche e Privacy.',
  },
];

export default function Faq() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <Screen title="Aiuto e FAQ" subtitle="Le domande più frequenti su Bet4Fun." onBack={() => navigate('/profilo')}>
      <div style={{ padding: '0 22px 30px' }}>
        {FAQS.map((f, i) => {
          const open = openIdx === i;
          return (
            <div
              key={i}
              style={{
                background: '#111830', border: '1px solid rgba(255,255,255,0.04)',
                borderRadius: 14, marginBottom: 8, overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', background: 'transparent', border: 0,
                  color: '#F5F6FA', padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  fontFamily: 'Inter', fontSize: 14, fontWeight: 600,
                }}
              >
                {f.q}
                <span style={{ color: '#FFDD2E', fontSize: 18, flexShrink: 0 }}>{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div style={{ padding: '0 16px 16px', fontSize: 13, color: 'rgba(245,246,250,0.7)', lineHeight: 1.6 }}>
                  {f.a}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 18, fontSize: 13, color: 'rgba(245,246,250,0.6)', lineHeight: 1.6, textAlign: 'center' }}>
          Non hai trovato risposta? Scrivi al gestore del tuo gruppo.
        </div>
      </div>
    </Screen>
  );
}
