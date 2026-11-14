import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = icons[toast.type] || Info;
  return <div className={`toast toast-${toast.type || 'info'}`} role="status"><Icon size={18}/><span>{toast.message}</span><button onClick={onClose} className="toast-close"><X size={15}/></button></div>;
}
