export function percentageChange(current, baseline) {
  const c = Number(current);
  const b = Number(baseline);
  if (!Number.isFinite(c) || !Number.isFinite(b) || b === 0) return null;
  return Number((((c - b) / Math.abs(b)) * 100).toFixed(1));
}

export function adherence(completed, prescribed) {
  const p = Number(prescribed);
  const c = Number(completed);
  if (!Number.isFinite(p) || p <= 0) return null;
  return Number(((c / p) * 100).toFixed(1));
}

export function chronological(records, field = 'date') {
  return [...records].sort((a, b) => new Date(a[field] || a.timestamp || a.createdAt) - new Date(b[field] || b.timestamp || b.createdAt));
}

export function filterByDate(records, from, to, field = 'date') {
  return records.filter((record) => {
    const d = new Date(record[field] || record.timestamp || record.createdAt);
    if (Number.isNaN(d.getTime())) return true;
    return (!from || d >= new Date(from)) && (!to || d <= new Date(`${to}T23:59:59`));
  });
}
