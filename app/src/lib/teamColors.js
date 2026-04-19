// Colori sociali + sigla per squadre comuni. Matching per nome normalizzato
// (case-insensitive, senza "FC"/"AC"/...). Fallback: colore derivato dal nome
// con sigla calcolata dalle iniziali.
//
// Formato voce: { primary, secondary, code }. Nome dopo la normalizzazione
// deve essere in chiave.

const TEAMS = {
  // Serie A
  'milan':               { primary: '#FB090B', secondary: '#010E1F', code: 'MIL' },
  'ac milan':            { primary: '#FB090B', secondary: '#010E1F', code: 'MIL' },
  'inter':               { primary: '#0055A4', secondary: '#000000', code: 'INT' },
  'internazionale':      { primary: '#0055A4', secondary: '#000000', code: 'INT' },
  'juventus':            { primary: '#000000', secondary: '#FFFFFF', code: 'JUV' },
  'napoli':              { primary: '#12A0D7', secondary: '#004B9A', code: 'NAP' },
  'roma':                { primary: '#8E1F2F', secondary: '#F0BC42', code: 'ROM' },
  'lazio':               { primary: '#87D8F7', secondary: '#0E4B88', code: 'LAZ' },
  'atalanta':            { primary: '#1C1C1C', secondary: '#2A6DF3', code: 'ATA' },
  'fiorentina':          { primary: '#5B2D90', secondary: '#FFFFFF', code: 'FIO' },
  'bologna':             { primary: '#941730', secondary: '#17388B', code: 'BOL' },
  'torino':              { primary: '#7A0F24', secondary: '#FFB81C', code: 'TOR' },
  'udinese':             { primary: '#000000', secondary: '#FFFFFF', code: 'UDI' },
  'genoa':               { primary: '#C8102E', secondary: '#001E62', code: 'GEN' },
  'sampdoria':           { primary: '#002D72', secondary: '#EE3831', code: 'SAM' },
  'hellas verona':       { primary: '#F4E000', secondary: '#004695', code: 'VER' },
  'verona':              { primary: '#F4E000', secondary: '#004695', code: 'VER' },
  'cagliari':            { primary: '#B52532', secondary: '#002B5C', code: 'CAG' },
  'lecce':               { primary: '#C8102E', secondary: '#FFD700', code: 'LEC' },
  'parma':               { primary: '#FFDD2E', secondary: '#001E62', code: 'PAR' },
  'como':                { primary: '#0051A2', secondary: '#FFFFFF', code: 'COM' },
  'empoli':              { primary: '#004B9A', secondary: '#FFFFFF', code: 'EMP' },
  'monza':               { primary: '#D21E26', secondary: '#FFFFFF', code: 'MON' },
  'venezia':             { primary: '#F08B31', secondary: '#001E62', code: 'VEN' },
  'salernitana':         { primary: '#7A1028', secondary: '#FFFFFF', code: 'SAL' },
  'sassuolo':            { primary: '#007A4D', secondary: '#000000', code: 'SAS' },
  'frosinone':           { primary: '#F2B619', secondary: '#003A9B', code: 'FRO' },
  'cremonese':           { primary: '#B52532', secondary: '#808080', code: 'CRE' },
  'spezia':              { primary: '#FFFFFF', secondary: '#000000', code: 'SPE' },
  'pisa':                { primary: '#00377C', secondary: '#000000', code: 'PIS' },
  'cosenza':             { primary: '#C8102E', secondary: '#001E62', code: 'COS' },

  // Premier League
  'manchester united':   { primary: '#DA291C', secondary: '#FBE122', code: 'MUN' },
  'man united':          { primary: '#DA291C', secondary: '#FBE122', code: 'MUN' },
  'manchester city':     { primary: '#6CABDD', secondary: '#1C2C5B', code: 'MCI' },
  'man city':            { primary: '#6CABDD', secondary: '#1C2C5B', code: 'MCI' },
  'liverpool':           { primary: '#C8102E', secondary: '#00B2A9', code: 'LIV' },
  'chelsea':             { primary: '#034694', secondary: '#EF0107', code: 'CHE' },
  'arsenal':             { primary: '#EF0107', secondary: '#FFFFFF', code: 'ARS' },
  'tottenham':           { primary: '#132257', secondary: '#FFFFFF', code: 'TOT' },
  'newcastle':           { primary: '#241F20', secondary: '#FFFFFF', code: 'NEW' },
  'aston villa':         { primary: '#95BFE5', secondary: '#670E36', code: 'AVL' },
  'west ham':            { primary: '#7A263A', secondary: '#1BB1E7', code: 'WHU' },
  'everton':             { primary: '#003399', secondary: '#FFFFFF', code: 'EVE' },
  'brighton':            { primary: '#0057B8', secondary: '#FFCD00', code: 'BHA' },
  'crystal palace':      { primary: '#1B458F', secondary: '#C4122E', code: 'CRY' },
  'brentford':           { primary: '#E30613', secondary: '#FFFFFF', code: 'BRE' },
  'fulham':              { primary: '#FFFFFF', secondary: '#000000', code: 'FUL' },
  'wolves':              { primary: '#FDB913', secondary: '#231F20', code: 'WOL' },
  'leeds':               { primary: '#FFFFFF', secondary: '#1D428A', code: 'LEE' },
  'bournemouth':         { primary: '#DA291C', secondary: '#000000', code: 'BOU' },
  'nottingham forest':   { primary: '#DD0000', secondary: '#FFFFFF', code: 'NFO' },

  // La Liga
  'real madrid':         { primary: '#FFFFFF', secondary: '#00529F', code: 'RMA' },
  'barcelona':           { primary: '#A50044', secondary: '#004D98', code: 'BAR' },
  'atletico madrid':     { primary: '#CB3524', secondary: '#272E61', code: 'ATM' },
  'sevilla':             { primary: '#D4001A', secondary: '#FFFFFF', code: 'SEV' },
  'real betis':          { primary: '#00954C', secondary: '#FFFFFF', code: 'BET' },
  'valencia':            { primary: '#F18E00', secondary: '#000000', code: 'VAL' },
  'villarreal':          { primary: '#FFE667', secondary: '#00519A', code: 'VIL' },
  'athletic bilbao':     { primary: '#EE2523', secondary: '#FFFFFF', code: 'ATH' },
  'real sociedad':       { primary: '#143C8B', secondary: '#FFFFFF', code: 'RSO' },
  'getafe':              { primary: '#005CA9', secondary: '#FFFFFF', code: 'GET' },
  'celta vigo':          { primary: '#8ABFFF', secondary: '#C8102E', code: 'CEL' },
  'osasuna':             { primary: '#D91A21', secondary: '#0A2240', code: 'OSA' },
  'mallorca':            { primary: '#CC0000', secondary: '#000000', code: 'MAL' },
  'girona':              { primary: '#CD2D2D', secondary: '#FFFFFF', code: 'GIR' },
  'rayo vallecano':      { primary: '#FFFFFF', secondary: '#E30613', code: 'RAY' },

  // Bundesliga
  'bayern munich':       { primary: '#DC052D', secondary: '#0066B2', code: 'BAY' },
  'bayern':              { primary: '#DC052D', secondary: '#0066B2', code: 'BAY' },
  'borussia dortmund':   { primary: '#FDE100', secondary: '#000000', code: 'BVB' },
  'dortmund':            { primary: '#FDE100', secondary: '#000000', code: 'BVB' },
  'rb leipzig':          { primary: '#DD0741', secondary: '#001F5B', code: 'RBL' },
  'bayer leverkusen':    { primary: '#E32221', secondary: '#000000', code: 'LEV' },
  'eintracht frankfurt': { primary: '#E1000F', secondary: '#000000', code: 'SGE' },
  'borussia mönchengladbach': { primary: '#000000', secondary: '#4FAE4D', code: 'BMG' },

  // Ligue 1
  'paris saint-germain': { primary: '#004170', secondary: '#DA291C', code: 'PSG' },
  'psg':                 { primary: '#004170', secondary: '#DA291C', code: 'PSG' },
  'olympique marseille': { primary: '#009DDC', secondary: '#FFFFFF', code: 'OM' },
  'marseille':           { primary: '#009DDC', secondary: '#FFFFFF', code: 'OM' },
  'olympique lyonnais':  { primary: '#1D338A', secondary: '#DA291C', code: 'OL' },
  'lyon':                { primary: '#1D338A', secondary: '#DA291C', code: 'OL' },
  'monaco':              { primary: '#E1000F', secondary: '#FFFFFF', code: 'MON' },
  'lille':               { primary: '#CE2A2E', secondary: '#FFFFFF', code: 'LIL' },
  'rennes':              { primary: '#E10600', secondary: '#000000', code: 'REN' },
  'nice':                { primary: '#EA1A1D', secondary: '#000000', code: 'NCE' },
};

function normalize(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(fc|ac|as|ssc|us|ss|sc|fk|bk|rc|cf|cd|rcd|real(?=\s))\s+/i, '')
    .replace(/\s+(fc|cf|fk)$/i, '')
    .replace(/\./g, '')
    .trim();
}

// Hash deterministico → colore pastello. Usato come fallback.
function hashColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function initials(name) {
  return (name || '')
    .replace(/[^A-Za-zÀ-ÿ\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((w) => w[0].toUpperCase())
    .join('')
    .slice(0, 3) || '?';
}

export function teamStyle(name) {
  const key = normalize(name);
  const entry = TEAMS[key];
  if (entry) return entry;
  // Prova a matchare per prefisso se l'API ha aggiunto "FC" o città.
  for (const k of Object.keys(TEAMS)) {
    if (key.includes(k) || k.includes(key)) return TEAMS[k];
  }
  const c = hashColor(key || 'unknown');
  return { primary: c, secondary: '#0A0F1F', code: initials(name) };
}
