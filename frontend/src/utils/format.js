export const titleCase = (value = '') => String(value).replace(/([A-Z])/g, ' $1').replaceAll('_', ' ').replace(/^./, (s) => s.toUpperCase());
export const dateLabel = (value) => value ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
export const numberLabel = (value, digits = 1) => value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? '—' : Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
export const phaseLabel = (value = '') => ({ preflight: 'Preflight', 'in-flight': 'In-flight', postflight: 'Postflight' }[value] || titleCase(value));
