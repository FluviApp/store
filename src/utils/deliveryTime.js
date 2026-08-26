// Helper de horario de entrega (admin). Formato oficial: rango "HH:MM - HH:MM".
// Retrocompatible con "07:00" (24h) y "12:00 AM" (12h).

export const parseSingleHour = (raw) => {
    if (raw == null) return null;
    const s = String(raw).trim();
    const m = s.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (Number.isNaN(h) || Number.isNaN(min)) return null;
    const ampm = (s.match(/(am|pm)/i) || [])[0];
    if (ampm) {
        const isPM = ampm.toLowerCase() === 'pm';
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
    }
    return { h: h % 24, m: min };
};

const pad = (n) => String(n).padStart(2, '0');
const toHHmm = ({ h, m }) => `${pad(h)}:${pad(m)}`;

export const startOfHour = (raw) => {
    if (raw == null || String(raw).trim() === '') return null;
    const first = String(raw).split('-')[0];
    const parsed = parseSingleHour(first);
    return parsed ? toHHmm(parsed) : null;
};

// Normaliza a rango canónico "HH:MM - HH:MM". Una hora suelta => bloque de 1h.
export const normalizeHourBlock = (raw) => {
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (s.includes('-')) {
        const [a, b] = s.split('-').map((x) => x.trim());
        const start = parseSingleHour(a);
        const end = parseSingleHour(b);
        if (!start) return null;
        if (!end) return `${toHHmm(start)} - ${toHHmm({ h: (start.h + 1) % 24, m: start.m })}`;
        return `${toHHmm(start)} - ${toHHmm(end)}`;
    }
    const start = parseSingleHour(s);
    if (!start) return null;
    return `${toHHmm(start)} - ${toHHmm({ h: (start.h + 1) % 24, m: start.m })}`;
};

// Construye la etiqueta de un bloque de 1h a partir de la hora de inicio (entero).
export const oneHourBlock = (startHour) => `${pad(startHour)}:00 - ${pad((startHour + 1) % 24)}:00`;

export default { parseSingleHour, startOfHour, normalizeHourBlock, oneHourBlock };
