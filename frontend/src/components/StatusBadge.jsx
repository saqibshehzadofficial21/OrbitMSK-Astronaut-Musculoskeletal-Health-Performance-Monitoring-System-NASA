export default function StatusBadge({ value = 'unknown' }) {
  const key = String(value).toLowerCase().replaceAll(' ', '-');
  return <span className={`status-badge status-${key}`}>{value}</span>;
}
