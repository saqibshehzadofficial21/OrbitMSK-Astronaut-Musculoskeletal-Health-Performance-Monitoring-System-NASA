export function validateRecord(record, required = []) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return 'Request body must be a JSON object';
  for (const key of required) {
    if (record[key] === undefined || record[key] === null || String(record[key]).trim() === '') return `${key} is required`;
  }
  return null;
}

export function toNumber(value, fallback = null) {
  if (value === '' || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}
