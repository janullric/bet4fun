// Format ISO date from TheSportsDB (es. "2026-04-20T19:45:00Z") in stringhe UI.

export function formatMatchDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `Oggi ${time}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()
  ) {
    return `Domani ${time}`;
  }
  return `${d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} ${time}`;
}

// "Ultima connessione" relativa: "ora", "5 min fa", "2 ore fa", "ieri", data.
export function formatLastSeen(iso) {
  if (!iso) return 'mai';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'poco fa';
  if (mins < 60) return `${mins} min fa`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'ora' : 'ore'} fa`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'ieri';
  if (days < 7) return `${days} giorni fa`;
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}

// Tempo residuo compatto: "2g 4h", "5h 20m", "32m".
export function formatCountdown(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Math.max(0, d.getTime() - Date.now());
  if (diff === 0) return 'In corso';
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}g ${hrs % 24}h`;
  if (hrs > 0) return `${hrs}h ${mins % 60}m`;
  return `${mins}m`;
}
