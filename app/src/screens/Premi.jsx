import { useState } from 'react';
import Screen from '../components/Screen.jsx';
import Funnie from '../components/Funnie.jsx';
import { useApp } from '../context/AppContext.jsx';

const PRIZES = [
  { id: 1, title: 'Sneakers Nike Dunk',       cat: 'sport', funnies: 28500, tag: 'Sport',     img: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=600&h=500&fit=crop' },
  { id: 2, title: 'AirPods Pro',              cat: 'tech',  funnies: 45000, tag: 'Tech',      img: 'https://images.unsplash.com/photo-1606741965326-cb990ae01bb2?w=600&h=500&fit=crop' },
  { id: 3, title: 'Buono Amazon 25€',         cat: 'buoni', funnies: 12500, tag: 'Buono',     img: 'https://images.unsplash.com/photo-1556742212-5b321f3c261b?w=600&h=500&fit=crop' },
  { id: 4, title: 'Pallone Champions League', cat: 'sport', funnies: 8500,  tag: 'Sport',     img: 'https://images.unsplash.com/photo-1614632537190-23e4146777db?w=600&h=500&fit=crop' },
  { id: 5, title: 'FIFA 26 PS5',              cat: 'games', funnies: 22000, tag: 'Gaming',    img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=500&fit=crop' },
  { id: 6, title: 'Abbonamento DAZN 1 mese',  cat: 'tech',  funnies: 18000, tag: 'Streaming', img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=500&fit=crop' },
];

const FEATURED_IMG = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=900&h=500&fit=crop';

const CATS = [
  { id: 'tutti', label: 'Tutti' },
  { id: 'sport', label: 'Sport' },
  { id: 'tech',  label: 'Tech' },
  { id: 'games', label: 'Gaming' },
  { id: 'buoni', label: 'Buoni' },
];

export default function Premi() {
  const [cat, setCat] = useState('tutti');
  const { funnies } = useApp();
  const visible = cat === 'tutti' ? PRIZES : PRIZES.filter((p) => p.cat === cat);

  return (
    <Screen
      title="Premi"
      subtitle="Spendi i tuoi Funnies."
      headerRight={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: 'rgba(255,221,46,0.1)',
            border: '1px solid rgba(255,221,46,0.2)',
            borderRadius: 100,
          }}
        >
          <Funnie size={14} />
          <span
            style={{
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              color: '#FFDD2E',
            }}
          >
            {funnies.toLocaleString('it-IT')}
          </span>
        </div>
      }
    >
      {/* premio in evidenza */}
      <div style={{ padding: '0 22px 20px' }}>
        <div
          style={{
            borderRadius: 24,
            position: 'relative',
            overflow: 'hidden',
            minHeight: 180,
            color: '#F5F6FA',
            background: '#111830',
          }}
        >
          <img
            src={FEATURED_IMG}
            alt="iPhone 16 Pro"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(10,15,31,0.1) 0%, rgba(10,15,31,0.85) 100%)',
            }}
          />
          <div style={{ position: 'relative', padding: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: '#FFDD2E',
              }}
            >
              ⚡ Asta in corso · 3g 2h
            </div>
            <div
              style={{
                fontFamily: 'Space Grotesk',
                fontWeight: 700,
                fontSize: 22,
                letterSpacing: -0.6,
                lineHeight: 1.1,
                marginTop: 6,
              }}
            >
              iPhone 16 Pro
              <br />
              256GB
            </div>
            <div
              style={{
                marginTop: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: 'JetBrains Mono',
                    opacity: 0.7,
                    textTransform: 'uppercase',
                  }}
                >
                  Offerta più alta
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <Funnie size={20} />
                  <span
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontWeight: 800,
                      fontSize: 24,
                    }}
                  >
                    147.500
                  </span>
                </div>
              </div>
              <button
                style={{
                  background: '#FFDD2E',
                  color: '#0A0F1F',
                  border: 0,
                  borderRadius: 100,
                  padding: '12px 18px',
                  fontFamily: 'Space Grotesk',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Fai offerta →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* categorie */}
      <div
        style={{
          padding: '0 22px 18px',
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
        }}
      >
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            style={{
              padding: '9px 16px',
              borderRadius: 100,
              border: 0,
              cursor: 'pointer',
              background: cat === c.id ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
              color: cat === c.id ? '#0A0F1F' : 'rgba(245,246,250,0.75)',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: 'Inter',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* griglia premi */}
      <div
        style={{
          padding: '0 22px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        {visible.map((p) => {
          const affordable = funnies >= p.funnies;
          return (
            <div
              key={p.id}
              style={{
                background: '#111830',
                borderRadius: 18,
                padding: 12,
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  height: 110,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#0A0F1F',
                }}
              >
                <img
                  src={p.img}
                  alt={p.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    padding: '3px 8px',
                    borderRadius: 100,
                    background: 'rgba(10,15,31,0.75)',
                    backdropFilter: 'blur(4px)',
                    fontSize: 9,
                    fontFamily: 'JetBrains Mono',
                    color: '#F5F6FA',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    fontWeight: 600,
                  }}
                >
                  {p.tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 10,
                  lineHeight: 1.3,
                  minHeight: 34,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Funnie size={14} />
                  <span
                    style={{
                      fontFamily: 'Space Grotesk',
                      fontWeight: 700,
                      fontSize: 14,
                      color: affordable ? '#FFDD2E' : 'rgba(245,246,250,0.5)',
                    }}
                  >
                    {p.funnies.toLocaleString('it-IT')}
                  </span>
                </div>
                <button
                  style={{
                    background: affordable ? '#FFDD2E' : 'rgba(255,255,255,0.06)',
                    color: affordable ? '#0A0F1F' : 'rgba(245,246,250,0.3)',
                    border: 0,
                    borderRadius: 100,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    fontFamily: 'Space Grotesk',
                    cursor: affordable ? 'pointer' : 'not-allowed',
                  }}
                >
                  {affordable ? 'Prendi' : 'Serve +'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 30 }} />
    </Screen>
  );
}
