import { Check, Package, X } from 'lucide-react';

export function Badge({ children }) {
  const styles = { Available: 'status-green', Assigned: 'status-blue', Maintenance: 'status-amber', Lost: 'status-red', 'In transit': 'status-slate', 'Pending approval': 'status-amber', Approved: 'status-green', Ordered: 'status-blue', 'In review': 'status-violet', Returned: 'status-slate', High: 'status-amber', Critical: 'status-red', Normal: 'status-blue', Low: 'status-slate', Draft: 'status-slate' };
  return <span className={`status-badge ${styles[children] || 'status-slate'}`}><span className="status-dot" />{children}</span>;
}

export function Button({ children, variant = 'primary', icon: Icon, onClick, type = 'button' }) {
  return <button type={type} className={`button button-${variant}`} onClick={onClick}>{Icon && <Icon size={16} strokeWidth={2} />}{children}</button>;
}

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}

export function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className={`modal ${wide ? 'modal-wide' : ''}`}><div className="modal-header"><div><p className="eyebrow">Inventory workspace</p><h2>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>{children}</div></div>;
}

export function EmptyState({ icon: Icon = Package, title, text }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={24} /></div><h3>{title}</h3><p>{text}</p></div>;
}

export function Activity({ icon: Icon, tone, title, detail, time }) {
  return <div className="activity-item"><div className={`activity-icon ${tone}`}><Icon size={15} /></div><div><strong>{title}</strong><span>{detail}</span></div><time>{time}</time></div>;
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'blue' }) {
  return <div className="stat-card"><div className={`stat-icon stat-${tone}`}><Icon size={20} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></div>;
}

export function Info({ label, value, mono = false }) { return <div className="info-block"><span>{label}</span><strong className={mono ? 'mono' : ''}>{value}</strong></div>; }

export function Toast({ message }) { return message && <div className="toast"><Check size={16} />{message}</div>; }
