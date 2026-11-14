import { X } from 'lucide-react';

export default function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
    <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><div><span className="eyebrow">ORBITMSK WORKSPACE</span><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button></header>
      {children}
    </section>
  </div>;
}
